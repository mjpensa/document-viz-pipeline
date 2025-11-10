const puppeteer = require('puppeteer');
const config = require('../config/config');
const logger = require('../utils/logger');

class VisualRenderer {
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
      logger.info('Launching Puppeteer browser');
      this.browser = await puppeteer.launch({
        headless: config.puppeteer.headless,
        args: config.puppeteer.args,
        executablePath: config.puppeteer.executablePath
      });
      logger.info('Browser launched successfully');
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser', error);
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
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Failed to close browser', error);
      }
    }
  }

  /**
   * Render visualization code to image
   */
  async render(codeBlock) {
    try {
      logger.info('Rendering visualization', { type: codeBlock.type });

      switch (codeBlock.type) {
        case 'mermaid':
          return await this.renderMermaid(codeBlock.code);
        case 'plantuml':
          return await this.renderPlantUML(codeBlock.code);
        default:
          throw new Error(`Unsupported visualization type: ${codeBlock.type}`);
      }
    } catch (error) {
      logger.error('Failed to render visualization', error, { type: codeBlock.type });
      throw error;
    }
  }

  /**
   * Render Mermaid diagram
   */
  async renderMermaid(code) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: config.rendering.imageWidth,
        height: config.rendering.imageHeight
      });

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: white;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .mermaid {
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="mermaid">
${code}
            </div>
            <script>
              mermaid.initialize({ 
                startOnLoad: true,
                theme: 'default',
                securityLevel: 'loose'
              });
            </script>
          </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Wait for Mermaid to render
      await page.waitForSelector('.mermaid svg', { timeout: config.rendering.timeout });
      
      // Get the rendered SVG element
      const element = await page.$('.mermaid');
      
      if (!element) {
        throw new Error('Mermaid diagram not rendered');
      }

      // Get dimensions
      const boundingBox = await element.boundingBox();
      
      // Take screenshot with padding
      const imageBuffer = await element.screenshot({
        type: 'png',
        omitBackground: false
      });

      logger.info('Mermaid diagram rendered successfully', {
        width: boundingBox.width,
        height: boundingBox.height
      });

      return {
        imageBuffer,
        width: Math.round(boundingBox.width),
        height: Math.round(boundingBox.height),
        format: 'png'
      };
    } catch (error) {
      logger.error('Mermaid rendering failed', error);
      throw new Error(`Mermaid rendering failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Render PlantUML diagram
   */
  async renderPlantUML(code) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: config.rendering.imageWidth,
        height: config.rendering.imageHeight
      });

      // Use PlantUML's online server to render
      // Note: For production, consider self-hosting PlantUML server
      const plantumlCode = this.encodePlantUML(code);
      const imageUrl = `https://www.plantuml.com/plantuml/png/${plantumlCode}`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: white;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="PlantUML Diagram" />
          </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Wait for image to load
      await page.waitForSelector('img', { timeout: config.rendering.timeout });
      
      const element = await page.$('img');
      
      if (!element) {
        throw new Error('PlantUML diagram not rendered');
      }

      // Get dimensions
      const boundingBox = await element.boundingBox();
      
      // Take screenshot
      const imageBuffer = await element.screenshot({
        type: 'png',
        omitBackground: false
      });

      logger.info('PlantUML diagram rendered successfully', {
        width: boundingBox.width,
        height: boundingBox.height
      });

      return {
        imageBuffer,
        width: Math.round(boundingBox.width),
        height: Math.round(boundingBox.height),
        format: 'png'
      };
    } catch (error) {
      logger.error('PlantUML rendering failed', error);
      throw new Error(`PlantUML rendering failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Encode PlantUML code for URL
   * Using deflate + base64 encoding as per PlantUML specs
   */
  encodePlantUML(code) {
    const zlib = require('zlib');
    
    // Add @startuml/@enduml if not present
    let fullCode = code;
    if (!code.includes('@startuml')) {
      fullCode = `@startuml\n${code}\n@enduml`;
    }
    
    // Deflate compress
    const compressed = zlib.deflateRawSync(Buffer.from(fullCode, 'utf8'));
    
    // Encode to PlantUML's base64 variant
    return this.encode64(compressed);
  }

  /**
   * PlantUML base64 encoding
   */
  encode64(data) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
    let result = '';
    
    for (let i = 0; i < data.length; i += 3) {
      const b1 = data[i] & 0xFF;
      const b2 = i + 1 < data.length ? data[i + 1] & 0xFF : 0;
      const b3 = i + 2 < data.length ? data[i + 2] & 0xFF : 0;
      
      result += charset[b1 >> 2];
      result += charset[((b1 & 0x3) << 4) | (b2 >> 4)];
      result += charset[((b2 & 0xF) << 2) | (b3 >> 6)];
      result += charset[b3 & 0x3F];
    }
    
    return result;
  }

  /**
   * Render multiple code blocks
   */
  async renderMultiple(codeBlocks) {
    const results = [];
    
    for (const block of codeBlocks) {
      try {
        const rendered = await this.render(block);
        results.push({
          ...block,
          rendered
        });
      } catch (error) {
        logger.error('Failed to render code block', error, { 
          type: block.type,
          position: block.startPosition 
        });
        // Continue with other blocks even if one fails
        results.push({
          ...block,
          rendered: null,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new VisualRenderer();
