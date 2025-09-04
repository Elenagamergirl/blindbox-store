const express = require('express');
const path = require('path');
const connectDB = require('./database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Admin route FIRST -----
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Example API for testing admin
app.get('/admin/api/test', (req, res) => {
  res.json({ message: 'Admin API works!' });
});

// ----- Main website route -----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----- Serve other static files (css, js, images) -----
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
