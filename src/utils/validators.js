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
  validateMimeType(mimetype) {
    if (!config.upload.allowedMimeTypes.includes(mimetype)) {
      throw new Error(`Invalid MIME type. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`);
    }
    return true;
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
    this.validateMimeType(file.mimetype);

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
