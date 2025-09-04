console.log("Render assigned PORT:", process.env.PORT);
const express = require('express');
const path = require('path');
const connectDB = require('./database');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Example route to verify API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Fallback for single-page app (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// PORT must come from Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
