const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('../src/server');
const fileManager = require('../src/utils/fileManager');

// Wait for server to initialize
beforeAll(async () => {
  await fileManager.initialize();
  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 2000));
});

// Cleanup after tests
afterAll(async () => {
  // Clean up test files
  const visualRenderer = require('../src/services/visualRenderer');
  const pdfGenerator = require('../src/services/pdfGenerator');
  
  await visualRenderer.cleanup();
  await pdfGenerator.cleanup();
});

describe('Health Check', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('healthy');
  });
});

describe('Document Upload and Processing', () => {
  test('POST /api/upload without file should return 400', async () => {
    const response = await request(app)
      .post('/api/upload')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No file uploaded');
  });

  test('POST /api/upload with invalid file type should return 400', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.exe')
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('POST /api/upload with valid Markdown file should process successfully', async () => {
    const samplePath = path.join(__dirname, 'fixtures', 'sample.md');
    const fileContent = await fs.readFile(samplePath);

    const response = await request(app)
      .post('/api/upload')
      .attach('file', fileContent, 'sample.md')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.fileId).toBeDefined();
    expect(response.body.visualizationsFound).toBeGreaterThan(0);
    expect(response.body.visualizationsRendered).toBeGreaterThan(0);
    expect(response.body.downloadUrl).toBeDefined();
    expect(response.body.searchable).toBe(true);

    // Test download
    const fileId = response.body.fileId;
    const downloadResponse = await request(app)
      .get(`/api/download/${fileId}`)
      .expect(200);

    expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    expect(downloadResponse.body.length).toBeGreaterThan(0);
  }, 60000); // Increase timeout for rendering

  test('POST /api/upload with file containing no code should return 422', async () => {
    const textContent = 'This is a plain text file with no visualization code.';
    
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(textContent), 'plain.txt')
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No visualization code blocks found');
  });
});

describe('File Download', () => {
  test('GET /api/download/:fileId with invalid ID should return 404', async () => {
    const response = await request(app)
      .get('/api/download/invalid-file-id')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('File not found');
  });
});

describe('Service Integration', () => {
  test('Code detector should find Mermaid blocks', async () => {
    const codeDetector = require('../src/services/codeDetector');
    const samplePath = path.join(__dirname, 'fixtures', 'sample.md');
    const content = await fs.readFile(samplePath, 'utf-8');

    const blocks = codeDetector.detect(content);
    
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe('mermaid');
    expect(blocks[0].code).toBeDefined();
  });

  test('Document parser should parse Markdown', async () => {
    const documentParser = require('../src/services/documentParser');
    const samplePath = path.join(__dirname, 'fixtures', 'sample.md');

    const parsed = await documentParser.parse(samplePath, '.md');
    
    expect(parsed.type).toBe('markdown');
    expect(parsed.text).toBeDefined();
    expect(parsed.text.length).toBeGreaterThan(0);
  });

  test('Visual renderer should render Mermaid code', async () => {
    const visualRenderer = require('../src/services/visualRenderer');
    
    const codeBlock = {
      type: 'mermaid',
      code: 'graph TD\n    A[Start] --> B[End]'
    };

    const result = await visualRenderer.render(codeBlock);
    
    expect(result.imageBuffer).toBeDefined();
    expect(result.format).toBe('png');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  }, 30000);
});
