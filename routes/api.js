const express = require('express');
const router = express.Router();
const db = require('../database.js');

// Get all series with their boxes
router.get('/series', (req, res) => {
    db.all("SELECT * FROM series", (err, series) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // For each series, get its boxes
        const seriesWithBoxes = series.map(s => {
            return new Promise((resolve, reject) => {
                db.all(
                    "SELECT * FROM boxes WHERE series_id = ? AND available = 1", 
                    [s.id], 
                    (err, boxes) => {
                        if (err) reject(err);
                        else resolve({ ...s, boxes });
                    }
                );
            });
        });
        
        Promise.all(seriesWithBoxes)
            .then(results => res.json(results))
            .catch(error => res.status(500).json({ error: error.message }));
    });
});

// Get a specific box
router.get('/boxes/:id', (req, res) => {
    const boxId = req.params.id;
    db.get("SELECT * FROM boxes WHERE id = ?", [boxId], (err, box) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!box) {
            res.status(404).json({ error: "Box not found" });
            return;
        }
        res.json(box);
    });
});

// Create a new order
router.post('/orders', (req, res) => {
    const { customer_name, customer_email, items } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    items.forEach(item => {
        totalAmount += item.price * item.quantity;
    });
    
    // Insert order
    db.run(
        "INSERT INTO orders (customer_name, customer_email, total_amount) VALUES (?, ?, ?)",
        [customer_name, customer_email, totalAmount],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const orderId = this.lastID;
            
            // Insert order items and update inventory
            const orderItems = items.map(item => {
                return new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO order_items (order_id, box_id, quantity, price) VALUES (?, ?, ?, ?)",
                        [orderId, item.box_id, item.quantity, item.price],
                        (err) => {
                            if (err) reject(err);
                            
                            // Update box stock
                            db.run(
                                "UPDATE boxes SET stock = stock - ? WHERE id = ?",
                                [item.quantity, item.box_id],
                                (err) => {
                                    if (err) reject(err);
                                    
                                    // Update series available stock
                                    db.run(
                                        "UPDATE series SET available_stock = available_stock - ? WHERE id = (SELECT series_id FROM boxes WHERE id = ?)",
                                        [item.quantity, item.box_id],
                                        (err) => {
                                            if (err) reject(err);
                                            resolve();
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
            
            Promise.all(orderItems)
                .then(() => {
                    res.json({ 
                        message: "Order created successfully", 
                        order_id: orderId 
                    });
                })
                .catch(error => {
                    res.status(500).json({ error: error.message });
                });
        }
    );
});

// Get all orders
router.get('/orders', (req, res) => {
    db.all(`
        SELECT o.*, 
               GROUP_CONCAT(oi.box_id || ':' || oi.quantity || ':' || b.specific_name) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN boxes b ON oi.box_id = b.id
        GROUP BY o.id
        ORDER BY o.order_date DESC
    `, (err, orders) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Parse items for each order
        orders.forEach(order => {
            if (order.items) {
                order.items = order.items.split(',').map(item => {
                    const [box_id, quantity, specific_name] = item.split(':');
                    return { box_id: parseInt(box_id), quantity: parseInt(quantity), specific_name };
                });
            } else {
                order.items = [];
            }
        });
        
        res.json(orders);
    });
});

module.exports = router;