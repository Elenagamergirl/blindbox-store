const express = require('express');
const router = express.Router();
const db = require('../database.js');

// Get inventory data for admin
router.get('/inventory', (req, res) => {
    db.all(`
        SELECT s.*, 
               GROUP_CONCAT(b.id || '|' || b.specific_name || '|' || b.price || '|' || b.stock || '|' || b.available) as boxes
        FROM series s
        LEFT JOIN boxes b ON s.id = b.series_id
        GROUP BY s.id
    `, (err, series) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Parse boxes for each series
        series.forEach(s => {
            if (s.boxes) {
                s.boxes = s.boxes.split(',').map(box => {
                    const [id, specific_name, price, stock, available] = box.split('|');
                    return {
                        id: parseInt(id),
                        specific_name,
                        price: parseFloat(price),
                        stock: parseInt(stock),
                        available: parseInt(available) === 1
                    };
                });
            } else {
                s.boxes = [];
            }
        });
        
        res.json(series);
    });
});

// Update box stock
router.put('/inventory/box/:id', (req, res) => {
    const boxId = req.params.id;
    const { stock, available } = req.body;
    
    db.run(
        "UPDATE boxes SET stock = ?, available = ? WHERE id = ?",
        [stock, available ? 1 : 0, boxId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Update series available stock
            db.run(
                `UPDATE series 
                 SET available_stock = (
                     SELECT SUM(stock) FROM boxes 
                     WHERE series_id = (SELECT series_id FROM boxes WHERE id = ?) AND available = 1
                 )
                 WHERE id = (SELECT series_id FROM boxes WHERE id = ?)`,
                [boxId, boxId],
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    res.json({ message: "Box updated successfully" });
                }
            );
        }
    );
});

// Update order status
router.put('/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ message: "Order status updated successfully" });
        }
    );
});

module.exports = router;