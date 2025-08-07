# Harry's Lilla Lager - Portable Version

## 🚀 Quick Start
1. Double-click `harrys-lilla-lager.exe` to start the application
2. The app will automatically create a `data` folder and database file next to the executable
3. No installation required - completely portable!

## 📁 Files Included
- `harrys-lilla-lager.exe` - Main application
- `import_items.exe` - Utility for importing items from CSV files
- `harrys_lilla_lager_lib.dll` - Required library
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

## 🔧 Admin Access
- Click the Settings button in the main interface
- Password: `demoHH`
- Access department mappings, item management, and system tools

## 📊 CSV Import
Use the `import_items.exe` utility or the admin panel to import items:
```
Format: barcode,name
Example:
ABC123,Test Item 1
DEF456,Test Item 2
```

## 🖥️ System Requirements
- Windows 10/11 (64-bit)
- No additional software required
- Network drive compatible

## 📞 Support
This is a portable, self-contained version that includes all necessary components.
The database and all data files are created locally in the same folder as the executable.
