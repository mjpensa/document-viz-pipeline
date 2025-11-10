const logger = require('../utils/logger');

class CodeDetector {
  constructor() {
    // Mermaid diagram type keywords
    this.mermaidTypes = [
      'flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 
      'stateDiagram', 'erDiagram', 'journey', 'gantt', 
      'pie', 'gitGraph', 'mindmap', 'timeline'
    ];
  }

  /**
   * Detect all visualization code blocks in text
   */
  detect(text) {
    logger.info('Detecting visualization code blocks', {
      textLength: text.length,
      hasMermaidKeyword: text.includes('mermaid'),
      hasBackticks: text.includes('```'),
      firstChars: text.substring(0, 100)
    });
    
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
      plantuml: plantumlBlocks.length,
      blocks: codeBlocks.map(b => ({ type: b.type, codeLength: b.code.length }))
    });
    
    return codeBlocks;
  }

  /**
   * Detect Mermaid code blocks
   */
  detectMermaid(text) {
    const blocks = [];
    
    // Pattern 1: ```mermaid ... ```
    const backtickPattern = /```mermaid\s*\n([\s\S]*?)```/gi;
    let match;
    
    while ((match = backtickPattern.exec(text)) !== null) {
      blocks.push({
        type: 'mermaid',
        code: match[1].trim(),
        startPosition: match.index,
        endPosition: match.index + match[0].length,
        originalBlock: match[0]
      });
    }
    
    // Pattern 2: ---- delimited blocks with diagram types
    // Matches: ---- \n diagram-type ... \n ----
    const delimiterPattern = /----\s*\n((?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline)\s+[\s\S]*?)\n----/gi;
    
    while ((match = delimiterPattern.exec(text)) !== null) {
      // Check if overlapping with backtick blocks
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
    
    // Pattern 3: Direct diagram types without delimiters (separated by blank lines)
    // Look for diagram type at start of line, followed by content until double newline
    const diagramTypes = this.mermaidTypes.join('|');
    const directPattern = new RegExp(`(?:^|\\n\\n)((?:${diagramTypes})\\s+[^\\n]+(?:\\n(?!\\n|----)[^\\n]*)*)`, 'gim');
    
    while ((match = directPattern.exec(text)) !== null) {
      // Check if overlapping with previous patterns
      const isOverlapping = blocks.some(block => 
        match.index >= block.startPosition && match.index < block.endPosition
      );
      
      if (!isOverlapping && match[1].trim().length > 10) {
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
    
    // Pattern 1: ```plantuml ... ```
    const backtickPattern = /```plantuml\s*\n([\s\S]*?)```/gi;
    let match;
    
    while ((match = backtickPattern.exec(text)) !== null) {
      blocks.push({
        type: 'plantuml',
        code: match[1].trim(),
        startPosition: match.index,
        endPosition: match.index + match[0].length,
        originalBlock: match[0]
      });
    }
    
    // Pattern 2: @startuml ... @enduml
    const altPattern = /@startuml\s*\n([\s\S]*?)@enduml/gi;
    
    while ((match = altPattern.exec(text)) !== null) {
      // Check if overlapping with backtick blocks
      const isOverlapping = blocks.some(block => 
        match.index >= block.startPosition && match.index < block.endPosition
      );
      
      if (!isOverlapping) {
        blocks.push({
          type: 'plantuml',
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
   * Check if document contains any visualization code
   */
  hasVisualizationCode(text) {
    // Check for backtick formats
    if (/```mermaid/i.test(text) || /```plantuml/i.test(text) || /@startuml/i.test(text)) {
      return true;
    }
    
    // Check for direct diagram types
    const diagramTypes = this.mermaidTypes.join('|');
    const directPattern = new RegExp(`(?:^|\\n)(?:${diagramTypes})\\s`, 'im');
    return directPattern.test(text);
  }

  /**
   * Get visualization types present in document
   */
  getVisualizationTypes(text) {
    const types = [];
    
    if (/```mermaid/i.test(text) || new RegExp(`(?:^|\\n)(?:${this.mermaidTypes.join('|')})\\s`, 'im').test(text)) {
      types.push('mermaid');
    }
    
    if (/```plantuml/i.test(text) || /@startuml/i.test(text)) {
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
