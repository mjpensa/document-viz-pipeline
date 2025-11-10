@echo off
REM Document Visualization Pipeline - Setup Script for Windows

echo ================================================
echo Document Visualization Pipeline Setup
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm is installed
npm --version
echo.

REM Install dependencies
echo ================================================
echo Installing dependencies...
echo This may take a few minutes...
echo ================================================
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env >nul 2>&1
    echo [OK] .env file created
    echo.
)

REM Create directories
if not exist uploads mkdir uploads
if not exist outputs mkdir outputs
echo [OK] Directories created
echo.

echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Next steps:
echo   1. Start development server: npm run dev
echo   2. Open browser to: http://localhost:3000
echo   3. Test with: tests\fixtures\sample.md
echo   4. Run tests: npm test
echo.
echo For deployment instructions, see QUICKSTART.md
echo.
pause
