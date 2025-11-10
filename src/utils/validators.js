const path = require('path');
const config = require('../config/config');

class Validators {
  /**
   * Validate file extension
   */
  validateFileExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (!config.upload.allowedExtensions.includes(ext)) {
      throw new Error(`Invalid file extension. Allowed: ${config.upload.allowedExtensions.join(', ')}`);
    }
    return ext;
  }

  /**
   * Validate file size
   */
  validateFileSize(fileSize) {
    if (fileSize > config.upload.maxFileSize) {
      const maxSizeMB = config.upload.maxFileSize / (1024 * 1024);
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }
    return true;
  }

  /**
   * Validate MIME type
   */
  validateMimeType(mimetype, filename) {
    // First check if MIME type is in allowed list
    if (config.upload.allowedMimeTypes.includes(mimetype)) {
      return true;
    }
    
    // If MIME type doesn't match, check if file extension is valid
    // This handles cases where browsers send generic MIME types for .md files
    const ext = path.extname(filename).toLowerCase();
    const mimeTypeByExtension = {
      '.md': ['text/markdown', 'text/plain', 'text/x-markdown', 'application/octet-stream'],
      '.txt': ['text/plain', 'application/octet-stream'],
      '.pdf': ['application/pdf'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']
    };
    
    if (mimeTypeByExtension[ext] && mimeTypeByExtension[ext].includes(mimetype)) {
      return true;
    }
    
    // If extension is allowed, accept it even if MIME type is generic
    if (config.upload.allowedExtensions.includes(ext)) {
      return true;
    }
    
    throw new Error(`Invalid MIME type. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`);
  }

  /**
   * Validate uploaded file
   */
  validateUploadedFile(file) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    this.validateFileSize(file.size);
    this.validateFileExtension(file.originalname);
    this.validateMimeType(file.mimetype, file.originalname);

    return true;
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255);
  }
}

module.exports = new Validators();
