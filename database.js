const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'database', 'blindbox.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database with tables
function initializeDatabase() {
    // Series table
    db.run(`CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        total_stock INTEGER DEFAULT 0,
        available_stock INTEGER DEFAULT 0,
        image_url TEXT
    )`);

    // Boxes table
    db.run(`CREATE TABLE IF NOT EXISTS boxes (
        id INTEGER PRIMARY KEY,
        series_id INTEGER,
        specific_name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        available BOOLEAN DEFAULT 1,
        FOREIGN KEY (series_id) REFERENCES series(id)
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        customer_email TEXT,
        total_amount DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        box_id INTEGER,
        quantity INTEGER,
        price DECIMAL(10,2),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (box_id) REFERENCES boxes(id)
    )`);

    // Insert sample data if tables are empty
    db.get("SELECT COUNT(*) as count FROM series", (err, row) => {
        if (row.count === 0) {
            insertSampleData();
        }
    });
}

// Insert sample data
function insertSampleData() {
    // Insert series
    const series = [
        { name: "Mystery Boxes", total_stock: 15, available_stock: 15 },
        { name: "Fantasy Collection", total_stock: 12, available_stock: 12 },
        { name: "Vintage Treasures", total_stock: 8, available_stock: 8 },
        { name: "Space Adventures", total_stock: 20, available_stock: 20 }
    ];

    series.forEach(s => {
        db.run(
            "INSERT INTO series (name, total_stock, available_stock) VALUES (?, ?, ?)",
            [s.name, s.total_stock, s.available_stock]
        );
    });

    // Insert boxes after a short delay to ensure series are created
    setTimeout(() => {
        const boxes = [
            // Mystery Boxes (series_id = 1)
            { id: 1, series_id: 1, specific_name: "Secret Enigma", price: 12.99, stock: 3 },
            { id: 2, series_id: 1, specific_name: "Hidden Surprise", price: 12.99, stock: 3 },
            { id: 3, series_id: 1, specific_name: "Mystery Package", price: 12.99, stock: 3 },
            { id: 4, series_id: 1, specific_name: "Puzzle Box", price: 12.99, stock: 3 },
            { id: 5, series_id: 1, specific_name: "Curious Container", price: 12.99, stock: 3 },
            
            // Fantasy Collection (series_id = 2)
            { id: 6, series_id: 2, specific_name: "Dragon Egg", price: 14.99, stock: 4 },
            { id: 7, series_id: 2, specific_name: "Wizard's Treasure", price: 14.99, stock: 4 },
            { id: 8, series_id: 2, specific_name: "Fairy Chest", price: 14.99, stock: 4 },
            
            // Vintage Treasures (series_id = 3)
            { id: 9, series_id: 3, specific_name: "Antique Mystery", price: 16.99, stock: 4 },
            { id: 10, series_id: 3, specific_name: "Classic Box", price: 16.99, stock: 4 },
            
            // Space Adventures (series_id = 4)
            { id: 11, series_id: 4, specific_name: "Alien Artifact", price: 15.99, stock: 4 },
            { id: 12, series_id: 4, specific_name: "Space Capsule", price: 15.99, stock: 4 },
            { id: 13, series_id: 4, specific_name: "Moon Rock", price: 15.99, stock: 4 },
            { id: 14, series_id: 4, specific_name: "Martian Surprise", price: 15.99, stock: 4 },
            { id: 15, series_id: 4, specific_name: "Galactic Gift", price: 15.99, stock: 4 }
        ];

        boxes.forEach(b => {
            db.run(
                "INSERT INTO boxes (id, series_id, specific_name, price, stock) VALUES (?, ?, ?, ?, ?)",
                [b.id, b.series_id, b.specific_name, b.price, b.stock]
            );
        });
        
        console.log("Sample data inserted");
    }, 1000);
}

module.exports = db;