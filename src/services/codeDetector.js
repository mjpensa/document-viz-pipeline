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
      hasFlowchart: text.includes('flowchart'),
      hasSequenceDiagram: text.includes('sequenceDiagram'),
      hasGraph: text.includes('graph'),
      firstChars: text.substring(0, 200),
      firstLines: text.split('\n').slice(0, 5)
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
      blocks: codeBlocks.map(b => ({ 
        type: b.type, 
        codeLength: b.code.length,
        firstLine: b.code.split('\n')[0]
      }))
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
    
    logger.debug('Backtick pattern found', { count: blocks.length });
    
    // Pattern 2: Direct diagram types (no backticks, no delimiters)
    // Matches diagram starting at line beginning, captures until we hit:
    // - Another diagram type keyword at line start
    // - A markdown heading
    // - End of document
    const diagramTypes = this.mermaidTypes.join('|');
    
    // Split text into lines for more precise detection
    const lines = text.split('\n');
    logger.debug('Scanning lines for direct diagram types', { 
      totalLines: lines.length,
      diagramTypes: this.mermaidTypes
    });
    
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Check if this line starts with a diagram type
      const diagramMatch = line.match(new RegExp(`^(${diagramTypes})\\s+`, 'i'));
      
      if (diagramMatch) {
        logger.debug('Found diagram start', { 
          lineNumber: i, 
          diagramType: diagramMatch[1],
          line: line.substring(0, 100)
        });
        
        // Found start of a diagram - collect lines until we find a stopping point
        const startIdx = i;
        const codeLines = [line];
        i++;
        
        // Continue collecting lines for this diagram
        while (i < lines.length) {
          const nextLine = lines[i];
          
          // Stop if we hit another diagram type at line start
          if (nextLine.match(new RegExp(`^(${diagramTypes})\\s+`, 'i'))) {
            break;
          }
          
          // Stop if we hit a markdown heading
          if (nextLine.match(/^#{1,6}\s/)) {
            break;
          }
          
          // Stop if we hit an empty line followed by non-indented text that looks like paragraph
          if (nextLine.trim() === '' && i + 1 < lines.length) {
            const lineAfterEmpty = lines[i + 1];
            // If next line doesn't start with spaces and isn't diagram syntax, we're done
            if (lineAfterEmpty.trim() !== '' && 
                !lineAfterEmpty.match(/^\s{4,}/) && 
                !lineAfterEmpty.match(/^[\s]*[-|>]/) &&
                !lineAfterEmpty.match(/^[\s]*[A-Z0-9]+[\[\(:]/) &&
                !lineAfterEmpty.match(/^[\s]*participant /i) &&
                !lineAfterEmpty.match(/^[\s]*Note /i) &&
                !lineAfterEmpty.match(/^[\s]*subgraph /i) &&
                !lineAfterEmpty.match(/^[\s]*end\s*$/i)) {
              break;
            }
          }
          
          codeLines.push(nextLine);
          i++;
        }
        
        const code = codeLines.join('\n').trim();
        
        // Calculate position in original text
        const beforeText = lines.slice(0, startIdx).join('\n');
        const startPosition = beforeText.length + (startIdx > 0 ? 1 : 0);
        
        // Check if overlapping with backtick blocks
        const isOverlapping = blocks.some(block => 
          startPosition >= block.startPosition && startPosition < block.endPosition
        );
        
        if (!isOverlapping && code.length > 15) {
          logger.debug('Adding mermaid block', {
            codeLength: code.length,
            firstLine: code.split('\n')[0]
          });
          blocks.push({
            type: 'mermaid',
            code: code,
            startPosition: startPosition,
            endPosition: startPosition + code.length,
            originalBlock: code
          });
        } else {
          logger.debug('Skipping block', { 
            isOverlapping, 
            codeLength: code.length,
            reason: isOverlapping ? 'overlapping' : 'too short'
          });
        }
      } else {
        i++;
      }
    }
    
    logger.debug('Direct pattern detection complete', { blocksFound: blocks.length });
    
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
