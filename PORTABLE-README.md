# Harry's Lilla Lager - Portable Inventory System

## Quick Start
1. Double-click `harrys-lilla-lager.exe` to start the application
2. The app will run minimized in the system tray
3. Right-click the tray icon to access all features
4. Double-click the tray icon to open the admin panel

## Tray Features
- **Single click**: Quick scan popup
- **Double click**: Open admin panel
- **Right-click menu**:
  - Open Admin Panel
  - Quick Scan
  - Start Scan Session
  - Export Data
  - Quit

## Files
- `harrys-lilla-lager.exe` - Main application (fully portable)
- `data/inventory.db` - Database (created automatically)
- `icon.png` - Tray icon (optional, embedded in exe)
- `items_import.txt` - Sample items to import (optional)

## First Run
1. The database will be created in the `data/` folder
2. Import sample items using "Import from file" feature
3. Configure department mappings in the admin panel

## Truly Portable
- No installation required
- All data stored next to the executable
- Single .exe file with embedded resources
- No external dependencies

## Troubleshooting
- If tray icon doesn't appear, check Windows notification area settings
- Ensure Windows allows the app to run (Windows Defender may prompt)
- Database is stored in `data/inventory.db` next to the executable

## System Requirements
- Windows 10/11 
- No additional dependencies required (fully portable)
