# Deployment Guide - Ultra-Simple Surgical Inventory

## 🚀 **Quick Deployment**

### **Step 1: Get the Portable Executable**
1. Download `Surgical Inventory System 1.0.0.exe` 
2. Copy to network drive or USB stick
3. **No installation required!**

### **Step 2: First Run**
1. Double-click the .exe file
2. App runs in system tray (bottom right)
3. Right-click tray icon → "Show Dashboard"
4. Click "Admin View" to set up equipment

### **Step 3: Configure Equipment (One Time)**
1. **Add Categories** (if needed):
   - Pre-configured: Käkkirurgi, Ortopedi, Neurologi, etc.
   - Add custom categories with barcode prefixes

2. **Add Equipment**:
   - Scan item barcode → Enter name → Select category
   - Or manually type barcode if no scanner yet

### **Step 4: Print Trigger Barcodes**
Create printable barcodes for these texts:
- `SCAN_START`
- `ACTIVATE`

Stick these barcodes on walls where staff scan instruments.

### **Step 5: Configure Barcode Scanner**
Set scanner to:
- ✅ **Keyboard emulation mode**
- ✅ **Add "Enter" after each scan**
- ✅ **No prefix/suffix characters**

## 📁 **File Locations**

### **Executable**
- `Surgical Inventory System 1.0.0.exe` - The main application

### **Data Storage**
- **Windows**: `%USERPROFILE%\AppData\Roaming\surgical-inventory-system\surgical-inventory.json`
- **Portable**: Data stored relative to .exe location

### **Backup**
- Copy the `surgical-inventory.json` file to backup data
- Restore by copying back to the same location

## 🔧 **Network Deployment**

### **Option 1: Shared Network Drive**
1. Copy .exe to `\\server\shared\SurgicalInventory\`
2. Users run directly from network
3. Each user gets their own data file

### **Option 2: Local Installation**
1. Copy .exe to each computer's Desktop
2. Share data files via network backup
3. Export/import CSV for data sync

## 🆘 **Troubleshooting**

### **Scanner not working?**
- Check scanner is in keyboard emulation mode
- Test scanner in notepad - should type characters
- Make sure "Enter" is sent after each scan

### **App not starting?**
- Check system tray for running instance
- Right-click tray icon to access features

### **Lost data?**
- Look for `surgical-inventory.json` in user AppData folder
- Check for backup files in same directory

### **Need to move between computers?**
1. Export data to CSV from current computer
2. Install on new computer
3. Import CSV data to new installation

## ✅ **Testing the Setup**

### **Quick Test Sequence**
1. Run the application
2. Right-click system tray → "Show Scanner"  
3. Type `SCAN_START` + Enter
4. Scanner window should open
5. Type any barcode + Enter
6. Should show "CHECKED OUT" result
7. Repeat same barcode - should show "CHECKED IN"

### **Test with Real Scanner**
1. Configure scanner for keyboard emulation
2. Scan the `SCAN_START` barcode
3. Scan an equipment barcode
4. Verify correct action is logged

## 🎯 **Go-Live Checklist**

- [ ] Portable .exe copied to final location
- [ ] Admin has configured all equipment categories
- [ ] All surgical instruments added to system
- [ ] Trigger barcodes printed and posted
- [ ] Barcode scanner configured and tested
- [ ] Staff trained on 2-scan workflow
- [ ] Backup procedure established
- [ ] System tray icon visible to users

**Ready for ultra-simple surgical inventory tracking!**
