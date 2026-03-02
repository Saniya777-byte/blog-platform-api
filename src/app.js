const express = require('express');
const cors = require('cors');
const path = require('path');

const tagRoutes = require('./routes/tag.routes');
const postRoutes = require('./routes/post.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();


// CORS — allow all origins in dev; lock down in production via env
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));


// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blog Platform API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


// API Routes
app.use('/api/tags', tagRoutes);
app.use('/api/posts', postRoutes);


// 404 handler for unknown API routes
// Express 5 uses /api/{*path} wildcard syntax

app.use('/api/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});


// Serve client for all other routes (SPA fallback)

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});


// Global error handler (must be last)

app.use(errorHandler);

module.exports = app;