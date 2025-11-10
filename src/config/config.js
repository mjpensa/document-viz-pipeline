require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.docx', '.md', '.txt'],
    uploadDir: './uploads',
    outputDir: './outputs'
  },
  
  // Puppeteer configuration
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  },
  
  // Rendering configuration
  rendering: {
    imageFormat: 'png',
    imageWidth: 1200,
    imageHeight: 800,
    dpi: 300,
    timeout: 30000 // 30 seconds
  },
  
  // PDF generation configuration
  pdf: {
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: false,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  },
  
  // File cleanup configuration
  cleanup: {
    enabled: true,
    retentionTime: 3600000 // 1 hour in milliseconds
  }
};
