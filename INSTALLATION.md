# 🎯 COMPLETE INSTALLATION GUIDE

## Project Location
**C:\document-viz-pipeline**

## ✅ Quick Installation (Windows)

### Option 1: Automated Setup (Recommended)

```powershell
# Navigate to project directory
cd C:\document-viz-pipeline

# Run setup script
.\setup.bat
```

This will automatically:
- Check Node.js installation
- Install all dependencies
- Create necessary directories
- Create .env file
- Display next steps

### Option 2: Manual Setup

```powershell
# 1. Navigate to project
cd C:\document-viz-pipeline

# 2. Install dependencies
npm install

# 3. Create environment file
copy .env.example .env

# 4. Create directories (if needed)
mkdir uploads
mkdir outputs
```

## 📦 What Gets Installed

### Production Dependencies
- **express** (4.18.2) - Web framework
- **multer** (1.4.5) - File upload handling
- **pdf-lib** (1.17.1) - PDF manipulation
- **pdfjs-dist** (3.11.174) - PDF text extraction
- **mammoth** (1.6.0) - DOCX parsing
- **docx** (8.5.0) - DOCX manipulation
- **markdown-it** (14.0.0) - Markdown parsing
- **puppeteer** (21.6.1) - Headless browser
- **@mermaid-js/mermaid-cli** (10.6.1) - Mermaid rendering
- **cors** (2.8.5) - CORS middleware
- **dotenv** (16.3.1) - Environment variables
- **uuid** (9.0.1) - Unique ID generation
- **node-plantuml** (0.9.0) - PlantUML support

### Development Dependencies
- **nodemon** (3.0.2) - Auto-reload server
- **jest** (29.7.0) - Testing framework
- **supertest** (6.3.3) - API testing

**Total Size**: ~500MB (includes Chromium for Puppeteer)

## 🚀 Starting the Application

### Development Mode (with auto-reload)
```powershell
npm run dev
```

### Production Mode
```powershell
npm start
```

### Server will start at:
**http://localhost:3000**

## ✅ Verify Installation

### 1. Check Health Endpoint
```powershell
# Using curl (if installed)
curl http://localhost:3000/api/health

# Or open in browser:
# http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "document-viz-pipeline",
  "version": "1.0.0"
}
```

### 2. Test Upload Interface
1. Open browser: **http://localhost:3000**
2. You should see the upload interface
3. Upload test file: **tests\fixtures\sample.md**
4. Wait for processing (~15-30 seconds)
5. PDF should download automatically

### 3. Run Tests
```powershell
npm test
```

All tests should pass!

## 📂 Project Files Overview

### Created Files (Total: 35+ files)

#### Configuration Files (6)
- ✅ package.json - Dependencies and scripts
- ✅ .gitignore - Git ignore rules
- ✅ .dockerignore - Docker ignore rules
- ✅ .env.example - Environment template
- ✅ jest.config.js - Test configuration
- ✅ railway.json - Railway deployment config

#### Source Code (14)
- ✅ src/server.js - Main entry point
- ✅ src/config/config.js - Configuration
- ✅ src/routes/upload.js - Upload endpoint
- ✅ src/routes/download.js - Download endpoint
- ✅ src/routes/health.js - Health check
- ✅ src/services/documentParser.js - Parse documents
- ✅ src/services/codeDetector.js - Detect code blocks
- ✅ src/services/visualRenderer.js - Render visualizations
- ✅ src/services/documentReconstructor.js - Reconstruct docs
- ✅ src/services/pdfGenerator.js - Generate PDFs
- ✅ src/utils/fileManager.js - File operations
- ✅ src/utils/logger.js - Logging
- ✅ src/utils/validators.js - Validation

#### Frontend (3)
- ✅ public/index.html - Web interface
- ✅ public/styles.css - Styling
- ✅ public/app.js - Frontend logic

#### Tests (2)
- ✅ tests/integration.test.js - Integration tests
- ✅ tests/fixtures/sample.md - Test document

#### Documentation (5)
- ✅ README.md - Main documentation
- ✅ QUICKSTART.md - Quick start guide
- ✅ API.md - API documentation
- ✅ PROJECT_SUMMARY.md - Project summary
- ✅ LICENSE - MIT License

#### Deployment (3)
- ✅ Dockerfile - Docker configuration
- ✅ .github/workflows/deploy.yml - CI/CD
- ✅ setup.bat - Windows setup script

#### Directories (2)
- ✅ uploads/ - Temporary uploads
- ✅ outputs/ - Temporary outputs

## 🔧 Troubleshooting

### Issue: npm install fails

**Solution 1**: Clear npm cache
```powershell
npm cache clean --force
npm install
```

**Solution 2**: Delete node_modules and reinstall
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Issue: Puppeteer fails to download Chromium

**Solution**: Set environment variable
```powershell
$env:PUPPETEER_SKIP_DOWNLOAD="true"
npm install puppeteer
```

Puppeteer will use your system Chrome instead.

### Issue: Port 3000 already in use

**Solution**: Find and kill process
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

Or use a different port:
```powershell
$env:PORT=3001
npm start
```

### Issue: Tests fail

**Solution**: Ensure server is not running
```powershell
# Stop any running servers first
# Then run tests
npm test
```

### Issue: Out of memory errors

**Solution**: Increase Node.js memory
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

## 🌐 Browser Compatibility

**Supported Browsers**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 💻 System Requirements

### Minimum
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **CPU**: 2 cores
- **RAM**: 2GB available
- **Disk**: 1GB free space
- **Node.js**: 18.0.0 or higher

### Recommended
- **OS**: Windows 11, macOS 12+, Linux (Ubuntu 20.04+)
- **CPU**: 4+ cores
- **RAM**: 4GB+ available
- **Disk**: 2GB free space
- **Node.js**: 18.0.0 or higher

## 📊 Performance Tips

### For Large Files
```javascript
// Increase memory in src/config/config.js
rendering: {
  timeout: 60000 // Increase to 60 seconds
}
```

### For Multiple Users
Consider deploying with:
- PM2 for process management
- Nginx for load balancing
- Redis for job queue

## 🔐 Security Notes

### For Production
1. Add authentication to API endpoints
2. Implement rate limiting
3. Use HTTPS
4. Add CSRF protection
5. Scan uploaded files for malware
6. Use environment variables for secrets

## 📱 Usage Examples

### Upload a Markdown File
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### Check Service Health
```javascript
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🎓 Next Steps

1. ✅ **Start Server**: `npm run dev`
2. ✅ **Test Upload**: Upload `tests\fixtures\sample.md`
3. ✅ **Run Tests**: `npm test`
4. ✅ **Read Docs**: Check README.md and API.md
5. ✅ **Deploy**: Follow QUICKSTART.md for Railway

## 📞 Getting Help

### Documentation
- **README.md** - Full documentation
- **QUICKSTART.md** - Setup guide
- **API.md** - API reference
- **PROJECT_SUMMARY.md** - Project overview

### Common Questions

**Q: How long does processing take?**
A: Typically 15-30 seconds depending on file size and number of diagrams.

**Q: What file formats are supported?**
A: PDF, DOCX, Markdown (.md), and plain text (.txt)

**Q: Are the generated PDFs searchable?**
A: Yes! All text remains searchable via Ctrl+F.

**Q: How long are files stored?**
A: Files are automatically deleted after 1 hour.

**Q: Can I process multiple files?**
A: Yes, upload them one at a time. Batch processing is a future feature.

## ✅ Installation Checklist

Before starting, verify:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] 1GB+ free disk space
- [ ] Port 3000 available
- [ ] Internet connection (for initial install)

After installation:
- [ ] Dependencies installed (npm install completed)
- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Upload interface loads in browser
- [ ] Test file processes successfully
- [ ] All tests pass

## 🎉 You're Ready!

The Document Visualization Pipeline is now installed and ready to use.

Open your browser to **http://localhost:3000** and start processing documents!

---

**Support**: Open an issue on GitHub or check the documentation files.
