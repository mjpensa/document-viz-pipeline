# Quick Start Guide

## Local Development Setup

### 1. Install Dependencies

```powershell
# Navigate to project directory
cd C:\document-viz-pipeline

# Install all dependencies
npm install
```

### 2. Create Environment File

```powershell
# Copy example environment file
copy .env.example .env
```

### 3. Start Development Server

```powershell
# Start with auto-reload
npm run dev

# Or start normally
npm start
```

The server will start at `http://localhost:3000`

### 4. Test the Application

Open your browser and navigate to `http://localhost:3000`

Upload the sample test file:
```powershell
# The test file is located at:
tests\fixtures\sample.md
```

## Running Tests

```powershell
# Run all integration tests
npm test
```

## Building Docker Image

```powershell
# Build the image
docker build -t document-viz-pipeline .

# Run the container
docker run -p 3000:3000 document-viz-pipeline
```

## Deployment to Railway

### Step 1: Initialize Git Repository

```powershell
git init
git add .
git commit -m "Initial commit: Document Visualization Pipeline"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `document-viz-pipeline`
3. Don't initialize with README (we already have one)

### Step 3: Push to GitHub

```powershell
git remote add origin https://github.com/YOUR_USERNAME/document-viz-pipeline.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Railway

1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `document-viz-pipeline` repository
5. Railway will automatically detect the Dockerfile
6. Set environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
7. Deploy!

### Step 5: Test Deployment

Once deployed, Railway will provide a public URL like:
`https://document-viz-pipeline-production.up.railway.app`

Test the health endpoint:
```powershell
curl https://your-app-url.railway.app/api/health
```

## Troubleshooting

### Puppeteer Issues on Windows

If Puppeteer fails to download Chromium:
```powershell
# Set environment variable before npm install
$env:PUPPETEER_SKIP_DOWNLOAD="true"
npm install

# Puppeteer will use your installed Chrome
```

### Port Already in Use

```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Memory Issues

```powershell
# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

## Project Structure Quick Reference

```
document-viz-pipeline/
├── src/
│   ├── server.js              # Entry point
│   ├── routes/                # API endpoints
│   │   ├── upload.js          # File upload
│   │   ├── download.js        # File download
│   │   └── health.js          # Health check
│   ├── services/              # Core services
│   │   ├── documentParser.js  # Parse docs
│   │   ├── codeDetector.js    # Find code
│   │   ├── visualRenderer.js  # Render images
│   │   ├── documentReconstructor.js  # Rebuild
│   │   └── pdfGenerator.js    # Generate PDF
│   ├── utils/                 # Utilities
│   │   ├── logger.js          # Logging
│   │   ├── validators.js      # Validation
│   │   └── fileManager.js     # File ops
│   └── config/
│       └── config.js          # Configuration
├── public/                    # Frontend
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/                     # Tests
│   ├── fixtures/
│   │   └── sample.md
│   └── integration.test.js
├── uploads/                   # Temp uploads (auto-created)
├── outputs/                   # Temp outputs (auto-created)
├── Dockerfile                 # Docker config
├── railway.json               # Railway config
└── package.json               # Dependencies
```

## Common Commands

```powershell
# Development
npm run dev                    # Start dev server
npm start                      # Start production server
npm test                       # Run tests

# Git
git status                     # Check status
git add .                      # Stage all changes
git commit -m "message"        # Commit changes
git push                       # Push to GitHub

# Docker
docker build -t app .          # Build image
docker run -p 3000:3000 app    # Run container
docker ps                      # List containers
docker logs <container-id>     # View logs
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm run dev`
3. ✅ Test locally: Upload `tests/fixtures/sample.md`
4. ✅ Run tests: `npm test`
5. ✅ Push to GitHub
6. ✅ Deploy to Railway
7. ✅ Test production deployment

## Support

- 📖 Check README.md for detailed documentation
- 🐛 Open GitHub issue for bugs
- 💡 Review tests for usage examples
