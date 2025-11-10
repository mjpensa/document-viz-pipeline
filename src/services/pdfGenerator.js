const puppeteer = require('puppeteer');
const { getDocument } = require('pdfjs-dist/legacy/build/pdf');
const config = require('../config/config');
const logger = require('../utils/logger');

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    try {
      logger.info('Launching Puppeteer browser for PDF generation');
      this.browser = await puppeteer.launch({
        headless: config.puppeteer.headless,
        args: config.puppeteer.args,
        executablePath: config.puppeteer.executablePath
      });
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser for PDF generation', error);
      throw error;
    }
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info('PDF generator browser closed');
      } catch (error) {
        logger.error('Failed to close PDF generator browser', error);
      }
    }
  }

  /**
   * Generate searchable PDF from reconstructed document
   */
  async generate(reconstructedDocument) {
    try {
      logger.info('Generating searchable PDF');

      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
        // Set viewport
        await page.setViewport({
          width: 1200,
          height: 1600
        });

        // Load HTML content
        await page.setContent(reconstructedDocument.html, {
          waitUntil: 'networkidle0'
        });

        // Wait a bit for images to fully render
        await page.waitForTimeout(1000);

        // Generate PDF with text layer preserved
        const pdfBuffer = await page.pdf({
          format: config.pdf.format,
          printBackground: config.pdf.printBackground,
          preferCSSPageSize: config.pdf.preferCSSPageSize,
          displayHeaderFooter: config.pdf.displayHeaderFooter,
          margin: config.pdf.margin
        });

        logger.info('PDF generated successfully', {
          size: pdfBuffer.length
        });

        // Verify PDF is searchable
        const isSearchable = await this.verifySearchability(pdfBuffer);
        
        if (!isSearchable) {
          logger.warn('Generated PDF may not be fully searchable');
        }

        return {
          buffer: pdfBuffer,
          metadata: {
            size: pdfBuffer.length,
            searchable: isSearchable,
            format: config.pdf.format,
            ...reconstructedDocument.metadata
          }
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      logger.error('Failed to generate PDF', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Verify PDF is searchable by extracting text
   */
  async verifySearchability(pdfBuffer) {
    try {
      const data = new Uint8Array(pdfBuffer);
      const loadingTask = getDocument({
        data,
        useSystemFonts: true
      });
      
      const pdfDocument = await loadingTask.promise;
      const page = await pdfDocument.getPage(1);
      const textContent = await page.getTextContent();
      
      // Check if text is extractable
      const hasText = textContent.items.length > 0 && 
                      textContent.items.some(item => item.str.trim().length > 0);
      
      logger.debug('PDF searchability check', {
        hasText,
        textItems: textContent.items.length
      });
      
      return hasText;
    } catch (error) {
      logger.error('Failed to verify PDF searchability', error);
      return false;
    }
  }

  /**
   * Extract text from PDF for validation
   */
  async extractText(pdfBuffer) {
    try {
      const data = new Uint8Array(pdfBuffer);
      const loadingTask = getDocument({
        data,
        useSystemFonts: true
      });
      
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      let fullText = '';

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      logger.error('Failed to extract text from PDF', error);
      throw error;
    }
  }

  /**
   * Validate PDF output
   */
  async validate(pdfBuffer, originalText) {
    try {
      // Extract text from generated PDF
      const extractedText = await this.extractText(pdfBuffer);
      
      // Check if PDF is not empty
      if (!extractedText || extractedText.length === 0) {
        throw new Error('Generated PDF contains no text');
      }

      // Verify no code blocks remain
      const codeBlockPatterns = [
        /```mermaid/gi,
        /```plantuml/gi,
        /@startuml/gi,
        /@enduml/gi
      ];

      let hasCodeBlocks = false;
      codeBlockPatterns.forEach(pattern => {
        if (pattern.test(extractedText)) {
          hasCodeBlocks = true;
          logger.error('Code block artifacts found in PDF', { pattern: pattern.source });
        }
      });

      if (hasCodeBlocks) {
        throw new Error('Generated PDF contains code block artifacts');
      }

      // Check that IMAGE_PLACEHOLDER markers are not in the PDF
      if (extractedText.includes('IMAGE_PLACEHOLDER')) {
        throw new Error('Image placeholder markers found in PDF');
      }

      logger.info('PDF validation successful', {
        extractedTextLength: extractedText.length,
        hasCodeBlocks: false
      });

      return {
        valid: true,
        extractedText,
        hasCodeBlocks: false
      };
    } catch (error) {
      logger.error('PDF validation failed', error);
      throw error;
    }
  }

  /**
   * Get PDF statistics
   */
  async getStatistics(pdfBuffer) {
    try {
      const data = new Uint8Array(pdfBuffer);
      const loadingTask = getDocument({ data });
      const pdfDocument = await loadingTask.promise;
      
      return {
        numPages: pdfDocument.numPages,
        fileSize: pdfBuffer.length,
        fileSizeMB: (pdfBuffer.length / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      logger.error('Failed to get PDF statistics', error);
      return {
        numPages: 0,
        fileSize: pdfBuffer.length,
        fileSizeMB: (pdfBuffer.length / (1024 * 1024)).toFixed(2)
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new PDFGenerator();
