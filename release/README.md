# Harry's Lilla Lager v0.1.0 - Network Drive Edition

## 📦 Distribution Files

### Portable Executable (Network Drive Compatible)
- **Harrys-Lilla-Lager-v0.1.0-NetworkDrive-Portable.exe** - Standalone executable optimized for network drives
  - Double-click to run
  - No admin rights required
  - **Database stored in `data/` folder next to executable** - perfect for shared network access
  - Automatic database cleanup to prevent infinite growth
  - Perfect for multi-user environments on network drives

### Windows Installer (Network Drive Compatible)
- **Harrys-Lilla-Lager-v0.1.0-NetworkDrive-Installer.msi** - Full Windows installer with network database support
  - Installs to Program Files but database stays with application
  - Creates Start Menu shortcuts
  - Includes uninstaller
  - Recommended for permanent network installation

## 🔧 Network Drive Setup

### Multi-User Database Access
The database is now stored in a `data/` folder next to the executable:
```
📁 Network Drive Folder/
├── Harrys-Lilla-Lager-v0.1.0-NetworkDrive-Portable.exe
└── 📁 data/
    └── inventory.db  ← Shared database for all users
```

### Automatic Database Maintenance
- **Automatic cleanup** on startup removes completed transactions older than 30 days
- **Manual cleanup commands** available through the admin interface
- **Database statistics** to monitor size and performance
- Prevents infinite database growth while preserving active data

## 🚀 Features

- **Barcode Scanning**: Support for barcode scanner input and manual entry
- **Inventory Tracking**: Check-in/check-out surgical instruments
- **Department Management**: Organize items by department prefixes
- **Barcode Generation**: Create custom barcodes with trigger codes
- **🖨️ Zebra ZD400 Printer**: Direct thermal label printing via network
- **Export Functions**: CSV and JSON export capabilities
- **Modern UI**: Clean, dark theme with Swedish localization
- **Tray Icon**: Minimizes to system tray for quick access
- **🆕 Network Database**: Shared database for multiple users
- **🆕 Auto Cleanup**: Prevents database from growing infinitely

## ⚡ Quick Start

1. Place the portable executable on your network drive
2. All users can run the same executable
3. Database will be created in `data/inventory.db` next to the executable
4. The application starts minimized in the system tray
5. Right-click the tray icon to access admin panel
6. Use the barcode generator to create trigger barcodes (SCAN_START, SCAN_END)
7. Scan items to track check-in/check-out status

## 💾 System Requirements

- Windows 10/11 (x64)
- ~50MB disk space
- Network drive with read/write access for all users
- No additional runtime dependencies

## �️ Database Behavior

### Data Retention
- **Checked-out items**: Kept indefinitely until checked back in
- **Completed transactions**: Automatically archived after 30 days
- **Active data**: Always preserved (currently checked-out items)
- **Manual cleanup**: Available through admin interface

### Multi-User Considerations
- ✅ **Thread-safe**: SQLite handles concurrent access
- ✅ **Shared state**: All users see the same inventory status
- ✅ **Automatic cleanup**: Prevents database bloat
- ⚠️ **File locking**: Only one user can write at a time (normal for SQLite)

## 📊 Data Export

- Export current checked-out items as CSV
- Export full logs with timestamps
- Automatic file naming with dates
- Database statistics and cleanup tools

## 🖨️ Zebra ZD400 Printer Integration

### Setup Instructions
1. Connect your Zebra ZD400 to the network
2. Note the printer's IP address (print network status label)
3. In the app: Barcode Generator → Settings gear → Enter IP address
4. Test connection before printing

### Features
- **Direct Network Printing**: Print labels directly via TCP/IP
- **Professional Labels**: Department, barcode, text, and date
- **ZPL Commands**: Native Zebra Programming Language
- **Configurable Settings**: IP, port, label size, print speed/density
- **Test Functions**: Connection test and test label printing

### Label Format
- **Size**: 2" x 1.5" (adjustable)
- **Content**: Department name, CODE128 barcode, readable text, date
- **Quality**: Optimized for surgical inventory tracking

---

**Version**: 0.1.0 Network Drive + Zebra Printer Edition  
**Build Date**: June 27, 2025  
**Architecture**: x64 Windows  
**Database**: Portable SQLite with automatic cleanup  
**New**: Zebra ZD400 thermal printer support
