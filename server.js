const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');

// Import routes
const webhookRoutes = require('./routes/webhooks');
const callRoutes = require('./routes/calls');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api', callRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Plivo IVR Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.env}`);
  console.log(`Callback base URL: ${config.server.callbackBaseUrl}`);
  console.log(`========================================\n`);
  console.log(`Open http://localhost:${PORT} in your browser to start`);
  console.log(`\nFor local development with Plivo webhooks:`);
  console.log(`1. Install ngrok: brew install ngrok`);
  console.log(`2. Run: ngrok http ${PORT}`);
  console.log(`3. Copy the https:// URL from ngrok output`);
  console.log(`4. Update CALLBACK_BASE_URL in .env with the ngrok URL`);
  console.log(`5. Restart this server\n`);
});

module.exports = app;
