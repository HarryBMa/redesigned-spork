# Harry's Lilla Lager - Single File Portable Version

## 🚀 Quick Start
1. Double-click `harrys-lilla-lager.exe` to start the application
2. The app will automatically create a `data` folder and database file next to the executable
3. No installation required - completely portable single file!

## 📁 Files Included
- `harrys-lilla-lager.exe` - Complete self-contained application
- `README.md` - This file

## 💾 Data Storage
- The application creates its own SQLite database in a `data` subfolder
- Database location: `data/inventory.db` (relative to executable)
- All scanned items, settings, and configurations are stored locally
- Completely self-contained - no registry entries or system files modified

## ✨ Features Fixed in This Version
- ✅ Proper prefix validation for department mappings
- ✅ Correctly populated inventory table showing checked-out items
- ✅ Auto-closing scan popup (3 seconds timeout + closes after successful scan)
- ✅ Modular code structure for better maintainability
- ✅ Portable database that travels with the executable
- ✅ **Built-in CSV import functionality in admin panel**

## 🔧 Admin Access
- Click the Settings button in the main interface
- Password: `demoHH`
- Access department mappings, item management, CSV import, and system tools

## 📊 CSV Import
Use the **"IMPORT CSV"** button in the admin panel to import items:
```
Format: barcode,name
Example:
ABC123,Test Item 1
DEF456,Test Item 2
```

### CSV Import Steps:
1. Access admin panel (Settings → Password: `demoHH`)
2. Click the blue **"IMPORT CSV"** button
3. Select your CSV file
4. Items will be automatically imported and you'll see a success message

## 🖥️ System Requirements
- Windows 10/11 (64-bit)
- No additional software required
- Network drive compatible
- **Single executable file - no DLLs or dependencies needed**

## 📞 Support
This is a single-file portable version that includes all necessary components.
The database and all data files are created locally in the same folder as the executable.

## 🎯 What's New in Single File Version
- ✅ No separate DLL files required
- ✅ Built-in CSV import (no separate import_items.exe needed)
- ✅ Optimized for size and performance
- ✅ True single-file deployment
- ✅ Static linking for maximum compatibility
