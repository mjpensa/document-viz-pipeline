const logger = require('../utils/logger');

class DocumentReconstructor {
  /**
   * Replace code blocks with rendered images in document text
   */
  reconstruct(parsedDocument, renderedBlocks) {
    try {
      logger.info('Reconstructing document with rendered images', {
        type: parsedDocument.type,
        blockCount: renderedBlocks.length
      });

      switch (parsedDocument.type) {
        case 'markdown':
        case 'text':
          return this.reconstructText(parsedDocument, renderedBlocks);
        case 'docx':
          return this.reconstructHTML(parsedDocument, renderedBlocks);
        case 'pdf':
          return this.reconstructHTML(parsedDocument, renderedBlocks);
        default:
          throw new Error(`Unsupported document type: ${parsedDocument.type}`);
      }
    } catch (error) {
      logger.error('Failed to reconstruct document', error);
      throw error;
    }
  }

  /**
   * Reconstruct text-based documents (Markdown, TXT)
   */
  reconstructText(parsedDocument, renderedBlocks) {
    let text = parsedDocument.text;
    
    // Sort blocks by position (descending) to replace from end to start
    // This prevents position shifts
    const sortedBlocks = [...renderedBlocks].sort((a, b) => b.startPosition - a.startPosition);
    
    // Replace code blocks with image placeholders
    sortedBlocks.forEach((block, index) => {
      if (block.rendered && block.rendered.imageBuffer) {
        const imagePlaceholder = `\n\n[IMAGE_PLACEHOLDER_${index}]\n\n`;
        text = text.substring(0, block.startPosition) + 
               imagePlaceholder + 
               text.substring(block.endPosition);
      }
    });

    // Convert to HTML with embedded images
    const html = this.textToHTML(text, renderedBlocks);

    return {
      text: text,
      html: html,
      renderedBlocks: renderedBlocks,
      metadata: {
        ...parsedDocument.metadata,
        visualizationsRendered: renderedBlocks.filter(b => b.rendered).length
      }
    };
  }

  /**
   * Reconstruct HTML-based documents (DOCX, PDF)
   */
  reconstructHTML(parsedDocument, renderedBlocks) {
    let text = parsedDocument.text || '';
    let html = parsedDocument.html || this.textToHTML(text, []);
    
    // Sort blocks by position (descending)
    const sortedBlocks = [...renderedBlocks].sort((a, b) => b.startPosition - a.startPosition);
    
    // Replace code blocks in text
    sortedBlocks.forEach((block, index) => {
      if (block.rendered && block.rendered.imageBuffer) {
        const imagePlaceholder = `\n\n[IMAGE_PLACEHOLDER_${index}]\n\n`;
        text = text.substring(0, block.startPosition) + 
               imagePlaceholder + 
               text.substring(block.endPosition);
      }
    });

    // Create HTML with embedded images
    html = this.textToHTML(text, renderedBlocks);

    return {
      text: text,
      html: html,
      renderedBlocks: renderedBlocks,
      metadata: {
        ...parsedDocument.metadata,
        visualizationsRendered: renderedBlocks.filter(b => b.rendered).length
      }
    };
  }

  /**
   * Convert text to HTML with embedded images
   */
  textToHTML(text, renderedBlocks) {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px;
      background: white;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    p {
      margin-bottom: 16px;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
`;

    // Escape HTML and convert to paragraphs
    const escapedText = this.escapeHtml(text);
    const paragraphs = escapedText.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      // Check if this paragraph is an image placeholder
      const placeholderMatch = paragraph.match(/\[IMAGE_PLACEHOLDER_(\d+)\]/);
      
      if (placeholderMatch) {
        const blockIndex = parseInt(placeholderMatch[1]);
        const block = renderedBlocks[blockIndex];
        
        if (block && block.rendered && block.rendered.imageBuffer) {
          // Convert image buffer to base64
          const base64Image = block.rendered.imageBuffer.toString('base64');
          html += `  <img src="data:image/png;base64,${base64Image}" alt="${block.type} diagram" />\n`;
        }
      } else {
        // Regular paragraph
        const trimmed = paragraph.trim();
        if (trimmed) {
          // Check if it looks like a heading
          if (trimmed.startsWith('#')) {
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
              const level = headingMatch[1].length;
              const content = headingMatch[2];
              html += `  <h${level}>${content}</h${level}>\n`;
            } else {
              html += `  <p>${trimmed.replace(/\n/g, '<br>')}</p>\n`;
            }
          } else {
            html += `  <p>${trimmed.replace(/\n/g, '<br>')}</p>\n`;
          }
        }
      }
    });

    html += `
</body>
</html>
`;

    return html;
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
   * Validate reconstruction result
   */
  validate(reconstructed) {
    if (!reconstructed.html) {
      throw new Error('Reconstructed document missing HTML');
    }

    if (!reconstructed.renderedBlocks || reconstructed.renderedBlocks.length === 0) {
      logger.warn('No rendered blocks in reconstructed document');
    }

    // Verify no code blocks remain in text
    const codeBlockPatterns = [
      /```mermaid[\s\S]*?```/gi,
      /```plantuml[\s\S]*?```/gi,
      /@startuml[\s\S]*?@enduml/gi
    ];

    codeBlockPatterns.forEach(pattern => {
      if (pattern.test(reconstructed.text)) {
        logger.warn('Code blocks still present in reconstructed text');
      }
    });

    return true;
  }

  /**
   * Get statistics about reconstruction
   */
  getStatistics(reconstructed) {
    return {
      totalBlocks: reconstructed.renderedBlocks.length,
      successfullyRendered: reconstructed.renderedBlocks.filter(b => b.rendered).length,
      failed: reconstructed.renderedBlocks.filter(b => !b.rendered).length,
      htmlLength: reconstructed.html.length
    };
  }
}

module.exports = new DocumentReconstructor();
