const config = require('../config/config');

class Logger {
  constructor() {
    this.isProduction = config.nodeEnv === 'production';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaString}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: error.message,
      stack: this.isProduction ? undefined : error.stack
    } : meta;
    console.error(this.formatMessage('ERROR', message, errorMeta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  debug(message, meta = {}) {
    if (!this.isProduction) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

module.exports = new Logger();
