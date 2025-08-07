# Build script for creating portable Harry's Lilla Lager
Write-Host "Building portable Harry's Lilla Lager..." -ForegroundColor Green

# Clean and build
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Path ".\portable-dist" -Recurse -Force -ErrorAction SilentlyContinue

# Build the application
Write-Host "Building Tauri application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Build Tauri in release mode
Set-Location ".\src-tauri"
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tauri build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Create portable distribution folder
Write-Host "Creating portable distribution..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path ".\portable-dist" -Force | Out-Null
New-Item -ItemType Directory -Path ".\portable-dist\data" -Force | Out-Null

# Copy executable
Copy-Item ".\src-tauri\target\release\harrys-lilla-lager.exe" ".\portable-dist\harrys-lilla-lager.exe"

# Copy essential files
Copy-Item ".\items_import.txt" ".\portable-dist\items_import.txt" -ErrorAction SilentlyContinue
Copy-Item ".\README.md" ".\portable-dist\README.md"

# Copy just the main icon (no theme switching)
Copy-Item ".\src-tauri\icons\icon.png" ".\portable-dist\icon.png" -ErrorAction SilentlyContinue

# Get file size
$fileSize = (Get-Item ".\portable-dist\harrys-lilla-lager.exe").Length / 1MB
Write-Host "Portable build completed!" -ForegroundColor Green
Write-Host "Executable size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Blue
Write-Host "Location: .\portable-dist\" -ForegroundColor Blue
Write-Host "Files included:" -ForegroundColor Blue
Get-ChildItem ".\portable-dist\" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
