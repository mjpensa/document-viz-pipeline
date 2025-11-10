const CodeDetector = require('./src/services/codeDetector');
const fs = require('fs');

const detector = new CodeDetector();
const text = fs.readFileSync('test-actual-format.md', 'utf8');

console.log('Testing code detector with actual research format (no delimiters)...\n');
console.log('Text length:', text.length);
console.log('Has backticks:', text.includes('```'));
console.log('Has flowchart:', text.includes('flowchart'));
console.log('Has sequenceDiagram:', text.includes('sequenceDiagram'));
console.log('\n--- Detection Results ---');
const blocks = detector.detect(text);
console.log(`Found ${blocks.length} blocks:`);
blocks.forEach((block, i) => {
  console.log(`\n========== Block ${i + 1} ==========`);
  console.log('Type:', block.type);
  console.log('Code length:', block.code.length);
  console.log('Code:\n' + block.code);
  console.log('========================\n');
});
