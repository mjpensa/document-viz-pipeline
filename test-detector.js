const CodeDetector = require('./src/services/codeDetector');
const fs = require('fs');

const detector = new CodeDetector();
const text = fs.readFileSync('test-research-format.md', 'utf8');

console.log('Testing code detector with research format...\n');
console.log('Text length:', text.length);
console.log('Has ---- delimiters:', text.includes('----'));
console.log('Has flowchart:', text.includes('flowchart'));
console.log('Has sequenceDiagram:', text.includes('sequenceDiagram'));
console.log('\n--- Detection Results ---');
const blocks = detector.detect(text);
console.log(`Found ${blocks.length} blocks:`);
blocks.forEach((block, i) => {
  console.log(`\nBlock ${i + 1}:`);
  console.log('  Type:', block.type);
  console.log('  Code length:', block.code.length);
  console.log('  First 100 chars:', block.code.substring(0, 100));
});
