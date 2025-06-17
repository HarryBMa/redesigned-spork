@echo off
echo Building Portable Harrys lilla Lager...
echo.

echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Building React frontend...
call npm run build

echo.
echo [3/4] Building Electron app...
call npm run build:electron

echo.
echo [4/4] Creating portable executable...
call npx electron-builder --win --config.win.target=portable

echo.
echo ✅ Build complete!
echo.
echo 📁 Portable exe location: dist\Harrys lilla Lager 1.0.0.exe
echo.
echo 🚀 Copy this file to your network drive and run it!
echo.
pause
