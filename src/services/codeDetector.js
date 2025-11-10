const logger = require('../utils/logger');

class CodeDetector {
  constructor() {
    // Regex patterns for different visualization types
    this.patterns = {
      // Standard markdown format with backticks
      mermaid: /```mermaid\s*\n([\s\S]*?)```/gi,
      // Plain format without backticks (mermaid keyword followed by code until next section/empty lines)
      mermaidPlain: /\bmermaid\s*\n((?:(?!mermaid|plantuml|```|^#{1,6}\s|\n\s*\n\s*\n)[\s\S])+)/gmi,
      plantuml: /```plantuml\s*\n([\s\S]*?)```/gi,
      // Also support @startplantuml/@enduml syntax
      plantumlAlt: /@startuml\s*\n([\s\S]*?)@enduml/gi
    };
  }

  /**
   * Detect all visualization code blocks in text
   */
  detect(text) {
    logger.info('Detecting visualization code blocks');
    
    const codeBlocks = [];
    
    // Detect Mermaid blocks
    const mermaidBlocks = this.detectMermaid(text);
    codeBlocks.push(...mermaidBlocks);
    
    // Detect PlantUML blocks
    const plantumlBlocks = this.detectPlantUML(text);
    codeBlocks.push(...plantumlBlocks);
    
    // Sort by start position
    codeBlocks.sort((a, b) => a.startPosition - b.startPosition);
    
    logger.info(`Found ${codeBlocks.length} visualization code blocks`, {
      mermaid: mermaidBlocks.length,
      plantuml: plantumlBlocks.length
    });
    
    return codeBlocks;
  }

  /**
   * Detect Mermaid code blocks
   */
  detectMermaid(text) {
    const blocks = [];
    
    // Detect standard markdown format with backticks
    const regex1 = new RegExp(this.patterns.mermaid);
    let match;

    while ((match = regex1.exec(text)) !== null) {
      blocks.push({
        type: 'mermaid',
        code: match[1].trim(),
        startPosition: match.index,
        endPosition: match.index + match[0].length,
        originalBlock: match[0]
      });
    }

    // Detect plain format without backticks
    const regex2 = new RegExp(this.patterns.mermaidPlain);
    while ((match = regex2.exec(text)) !== null) {
      // Only add if not overlapping with backtick format
      const isOverlapping = blocks.some(block => 
        match.index >= block.startPosition && match.index < block.endPosition
      );
      
      if (!isOverlapping) {
        blocks.push({
          type: 'mermaid',
          code: match[1].trim(),
          startPosition: match.index,
          endPosition: match.index + match[0].length,
          originalBlock: match[0]
        });
      }
    }

    return blocks;
  }

  /**
   * Detect PlantUML code blocks
   */
  detectPlantUML(text) {
    const blocks = [];
    
    // Check markdown-style blocks
    const regex1 = new RegExp(this.patterns.plantuml);
    let match;

    while ((match = regex1.exec(text)) !== null) {
      blocks.push({
        type: 'plantuml',
        code: match[1].trim(),
        startPosition: match.index,
        endPosition: match.index + match[0].length,
        originalBlock: match[0]
      });
    }

    // Check @startuml/@enduml blocks
    const regex2 = new RegExp(this.patterns.plantumlAlt);
    while ((match = regex2.exec(text)) !== null) {
      blocks.push({
        type: 'plantuml',
        code: match[1].trim(),
        startPosition: match.index,
        endPosition: match.index + match[0].length,
        originalBlock: match[0]
      });
    }

    return blocks;
  }

  /**
   * Check if document contains any visualization code
   */
  hasVisualizationCode(text) {
    return this.patterns.mermaid.test(text) || 
           this.patterns.plantuml.test(text) ||
           this.patterns.plantumlAlt.test(text);
  }

  /**
   * Get visualization types present in document
   */
  getVisualizationTypes(text) {
    const types = [];
    
    if (this.patterns.mermaid.test(text)) {
      types.push('mermaid');
    }
    
    if (this.patterns.plantuml.test(text) || this.patterns.plantumlAlt.test(text)) {
      types.push('plantuml');
    }
    
    return types;
  }

  /**
   * Validate code block
   */
  validateCodeBlock(codeBlock) {
    if (!codeBlock.code || codeBlock.code.trim().length === 0) {
      logger.warn('Empty code block detected', { type: codeBlock.type });
      return false;
    }
    
    if (!['mermaid', 'plantuml'].includes(codeBlock.type)) {
      logger.warn('Unknown code block type', { type: codeBlock.type });
      return false;
    }
    
    return true;
  }

  /**
   * Get statistics about detected code blocks
   */
  getStatistics(codeBlocks) {
    const stats = {
      total: codeBlocks.length,
      byType: {}
    };

    codeBlocks.forEach(block => {
      if (!stats.byType[block.type]) {
        stats.byType[block.type] = 0;
      }
      stats.byType[block.type]++;
    });

    return stats;
  }
}

module.exports = new CodeDetector();
