const express = require('express');
const router = express.Router();
const path = require('path');
const fileManager = require('../utils/fileManager');
const logger = require('../utils/logger');

/**
 * GET /api/download/:fileId
 * Download processed PDF
 */
router.get('/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    const outputPath = fileManager.getOutputPath(fileId, '.pdf');
    
    // Check if file exists
    const fileBuffer = await fileManager.readFile(outputPath);

    logger.info('File downloaded', { fileId, size: fileBuffer.length });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="processed-${fileId}.pdf"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Send file
    res.send(fileBuffer);

    // Schedule cleanup after short delay to ensure download completes
    setTimeout(() => {
      fileManager.cleanupImmediately(outputPath).catch(err => {
        logger.error('Failed to cleanup after download', err, { fileId });
      });
    }, 5000);

  } catch (error) {
    logger.error('Download failed', error, { fileId });

    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'File not found or has expired'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    }
  }
});

module.exports = router;
