const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const logger = require('./logger');

class FileManager {
  constructor() {
    this.uploadDir = path.resolve(config.upload.uploadDir);
    this.outputDir = path.resolve(config.upload.outputDir);
    this.cleanupMap = new Map(); // Track files for cleanup
  }

  /**
   * Initialize directories
   */
  async initialize() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      logger.info('File directories initialized', {
        uploadDir: this.uploadDir,
        outputDir: this.outputDir
      });
    } catch (error) {
      logger.error('Failed to initialize directories', error);
      throw error;
    }
  }

  /**
   * Generate unique file ID
   */
  generateFileId() {
    return uuidv4();
  }

  /**
   * Get upload file path
   */
  getUploadPath(fileId, extension) {
    return path.join(this.uploadDir, `${fileId}${extension}`);
  }

  /**
   * Get output file path
   */
  getOutputPath(fileId, extension = '.pdf') {
    return path.join(this.outputDir, `${fileId}${extension}`);
  }

  /**
   * Save uploaded file
   */
  async saveUploadedFile(buffer, fileId, extension) {
    const filePath = this.getUploadPath(fileId, extension);
    try {
      await fs.writeFile(filePath, buffer);
      this.scheduleCleanup(filePath);
      logger.debug('File saved', { filePath, size: buffer.length });
      return filePath;
    } catch (error) {
      logger.error('Failed to save uploaded file', error, { filePath });
      throw error;
    }
  }

  /**
   * Save output file
   */
  async saveOutputFile(buffer, fileId, extension = '.pdf') {
    const filePath = this.getOutputPath(fileId, extension);
    try {
      await fs.writeFile(filePath, buffer);
      this.scheduleCleanup(filePath);
      logger.debug('Output file saved', { filePath, size: buffer.length });
      return filePath;
    } catch (error) {
      logger.error('Failed to save output file', error, { filePath });
      throw error;
    }
  }

  /**
   * Read file
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      logger.error('Failed to read file', error, { filePath });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug('File deleted', { filePath });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to delete file', error, { filePath });
      }
    }
  }

  /**
   * Schedule file cleanup
   */
  scheduleCleanup(filePath) {
    if (!config.cleanup.enabled) return;

    const timeoutId = setTimeout(async () => {
      await this.deleteFile(filePath);
      this.cleanupMap.delete(filePath);
    }, config.cleanup.retentionTime);

    this.cleanupMap.set(filePath, timeoutId);
  }

  /**
   * Cancel scheduled cleanup
   */
  cancelCleanup(filePath) {
    const timeoutId = this.cleanupMap.get(filePath);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.cleanupMap.delete(filePath);
    }
  }

  /**
   * Clean up immediately
   */
  async cleanupImmediately(filePath) {
    this.cancelCleanup(filePath);
    await this.deleteFile(filePath);
  }

  /**
   * Create temporary directory for processing
   */
  async createTempDir(fileId) {
    const tempDir = path.join(this.uploadDir, fileId);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Remove directory recursively
   */
  async removeDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      logger.debug('Directory removed', { dirPath });
    } catch (error) {
      logger.error('Failed to remove directory', error, { dirPath });
    }
  }
}

module.exports = new FileManager();
