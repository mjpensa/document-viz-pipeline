const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const MarkdownIt = require('markdown-it');
const { getDocument } = require('pdfjs-dist/legacy/build/pdf');
const logger = require('../utils/logger');

class DocumentParser {
  constructor() {
    this.md = new MarkdownIt();
  }

  /**
   * Parse document based on file type
   */
  async parse(filePath, fileType) {
    try {
      logger.info('Parsing document', { filePath, fileType });

      switch (fileType) {
        case '.pdf':
          return await this.parsePDF(filePath);
        case '.docx':
          return await this.parseDOCX(filePath);
        case '.md':
          return await this.parseMarkdown(filePath);
        case '.txt':
          return await this.parseText(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error('Failed to parse document', error, { filePath, fileType });
      throw error;
    }
  }

  /**
   * Parse PDF file
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = new Uint8Array(dataBuffer);
      
      const loadingTask = getDocument({
        data,
        useSystemFonts: true,
        standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
      });
      
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      let fullText = '';
      const pages = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
        pages.push({
          pageNumber: pageNum,
          text: pageText
        });
      }

      return {
        type: 'pdf',
        text: fullText.trim(),
        pages,
        metadata: {
          numPages,
          source: 'pdf'
        }
      };
    } catch (error) {
      logger.error('Failed to parse PDF', error, { filePath });
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file
   */
  async parseDOCX(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      
      // Also get plain text
      const textResult = await mammoth.extractRawText({ buffer });
      
      return {
        type: 'docx',
        text: textResult.value,
        html: result.value,
        metadata: {
          source: 'docx',
          messages: result.messages
        }
      };
    } catch (error) {
      logger.error('Failed to parse DOCX', error, { filePath });
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Markdown file
   */
  async parseMarkdown(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const html = this.md.render(content);
      
      return {
        type: 'markdown',
        text: content,
        html,
        metadata: {
          source: 'markdown'
        }
      };
    } catch (error) {
      logger.error('Failed to parse Markdown', error, { filePath });
      throw new Error(`Markdown parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   */
  async parseText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        type: 'text',
        text: content,
        html: `<pre>${this.escapeHtml(content)}</pre>`,
        metadata: {
          source: 'text'
        }
      };
    } catch (error) {
      logger.error('Failed to parse text file', error, { filePath });
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Extract text from parsed document
   */
  getText(parsedDocument) {
    return parsedDocument.text;
  }

  /**
   * Get document type
   */
  getType(parsedDocument) {
    return parsedDocument.type;
  }
}

module.exports = new DocumentParser();
