const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentParser = require('../services/documentParser');
const codeDetector = require('../services/codeDetector');
const visualRenderer = require('../services/visualRenderer');
const documentReconstructor = require('../services/documentReconstructor');
const pdfGenerator = require('../services/pdfGenerator');
const fileManager = require('../utils/fileManager');
const validators = require('../utils/validators');
const logger = require('../utils/logger');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * POST /api/upload
 * Upload and process document
 */
router.post('/', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let fileId = null;
  let uploadPath = null;

  try {
    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    validators.validateUploadedFile(req.file);
    
    // Generate file ID and save uploaded file
    fileId = fileManager.generateFileId();
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    uploadPath = await fileManager.saveUploadedFile(req.file.buffer, fileId, fileExtension);

    logger.info('File uploaded', {
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      type: fileExtension
    });

    // Step 1: Parse document
    const parsedDocument = await documentParser.parse(uploadPath, fileExtension);
    logger.debug('Document parsed', { type: parsedDocument.type });

    // Step 2: Detect visualization code blocks
    const codeBlocks = codeDetector.detect(parsedDocument.text);
    
    if (codeBlocks.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'No visualization code blocks found in document',
        message: 'Please ensure your document contains Mermaid or PlantUML code blocks wrapped in ``` markers'
      });
    }

    logger.info(`Found ${codeBlocks.length} visualization blocks`);

    // Step 3: Render visualizations to images
    const renderedBlocks = await visualRenderer.renderMultiple(codeBlocks);
    
    const successfulRenders = renderedBlocks.filter(b => b.rendered && !b.error).length;
    if (successfulRenders === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to render any visualizations',
        details: renderedBlocks.map(b => ({ type: b.type, error: b.error }))
      });
    }

    logger.info(`Rendered ${successfulRenders}/${codeBlocks.length} visualizations`);

    // Step 4: Reconstruct document with rendered images
    const reconstructed = await documentReconstructor.reconstruct(parsedDocument, renderedBlocks);
    documentReconstructor.validate(reconstructed);

    logger.debug('Document reconstructed');

    // Step 5: Generate searchable PDF
    const pdfResult = await pdfGenerator.generate(reconstructed);
    
    // Validate PDF
    await pdfGenerator.validate(pdfResult.buffer, parsedDocument.text);

    // Save output PDF
    const outputPath = await fileManager.saveOutputFile(pdfResult.buffer, fileId, '.pdf');

    // Get PDF statistics
    const pdfStats = await pdfGenerator.getStatistics(pdfResult.buffer);

    const processingTime = Date.now() - startTime;

    logger.info('Document processed successfully', {
      fileId,
      processingTime,
      visualizationsFound: codeBlocks.length,
      visualizationsRendered: successfulRenders,
      outputSize: pdfResult.buffer.length
    });

    // Clean up upload file immediately
    await fileManager.cleanupImmediately(uploadPath);

    res.json({
      success: true,
      fileId,
      downloadUrl: `/api/download/${fileId}`,
      processedAt: new Date().toISOString(),
      visualizationsFound: codeBlocks.length,
      visualizationsRendered: successfulRenders,
      fileSize: pdfResult.buffer.length,
      fileSizeMB: pdfStats.fileSizeMB,
      numPages: pdfStats.numPages,
      processingTimeMs: processingTime,
      searchable: pdfResult.metadata.searchable
    });

  } catch (error) {
    logger.error('Upload processing failed', error, { fileId });

    // Clean up on error
    if (uploadPath) {
      await fileManager.cleanupImmediately(uploadPath).catch(() => {});
    }

    const statusCode = error.message.includes('Invalid') ? 400 :
                       error.message.includes('too large') ? 413 :
                       error.message.includes('No visualization') ? 422 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      fileId
    });
  }
});

module.exports = router;
