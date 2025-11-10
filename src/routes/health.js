const express = require('express');
const router = express.Router();
const config = require('../config/config');

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'document-viz-pipeline',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime()
  });
});

module.exports = router;
