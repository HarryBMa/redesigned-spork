# Ultra-Simple Surgical Inventory System

## Overview
**Even simpler than paper!** This system requires only **2 scans maximum per item** - just like writing on paper, but digital.

## ✅ **Ultimate Simplicity**

### **Workflow (Simpler than Paper)**
1. **Scan hotkey barcode** → Scanner activates
2. **Scan item barcode** → Automatically processes (checkout/checkin)
3. **Done!** → Window auto-closes after showing result

**No buttons, no clicks, no user decisions needed!**

### **Paper System vs Digital**
| Paper System | Digital System |
|-------------|----------------|
| ✏️ Write item name | 📱 Scan item barcode |
| ❌ Cross off when back | 📱 Scan item barcode again |

**Same number of actions, but digital is:**
- ✅ Faster (no writing)
- ✅ More accurate (no handwriting)
- ✅ Automatic backup
- ✅ Never lost

## 🎯 **How It Works (Ultra-Simple)**

### **First Time Setup (Admin)**
1. **Add Equipment**: Scan barcode → Enter name → Select category
2. **Print Trigger Barcodes**: `SCAN_START`, `ACTIVATE`

### **Daily Use (Anyone)**
1. **Scan `SCAN_START`** → Scanner window opens
2. **Scan surgical instrument** → Automatically:
   - If never scanned before → **CHECKED OUT**
   - If last action was "out" → **CHECKED IN** 
   - If last action was "in" → **CHECKED OUT**
3. **Shows result for 3 seconds** → Window closes
4. **Ready for next scan**

### **Smart Auto-Detection**
The system **automatically knows** what to do:
- First scan of new item = Check Out
- Item currently out = Check In  
- Item currently in = Check Out

**No thinking required - just scan!**

## 🔧 **Technical Requirements ✅**

### **Barcode Scanner**
- ✅ Wireless keyboard emulation mode
- ✅ Suffix: Enter key after scan
- ✅ Works in background while others use computer

### **Portable Deployment**
- ✅ Single .exe file for network drives
- ✅ No installation required
- ✅ JSON database travels with exe

### **Headless Operation**
- ✅ Runs in system tray
- ✅ Minimal UI only when needed
- ✅ Global hotkey activation

### **Trigger Barcodes**
- ✅ `SCAN_START` - activates scanner
- ✅ `ACTIVATE` - activates scanner
- ✅ `TRIGGER` - activates scanner
- ✅ Admin can add custom triggers

## 📊 **Example Workflow**

```
Staff member gets surgical instrument:
1. Scan "SCAN_START" barcode on wall
2. Scan "KÄKX001" barcode on instrument
3. See "✅ CHECKED OUT - Käkkirurgi" for 3 seconds
4. Scanner closes automatically

Staff member returns from sterilization:
1. Scan "SCAN_START" barcode on wall  
2. Scan "KÄKX001" barcode on instrument
3. See "✅ CHECKED IN - Käkkirurgi" for 3 seconds
4. Scanner closes automatically
```

**Total time per transaction: ~5 seconds**
**User decisions required: 0**
**Buttons to click: 0**

## 🚀 **Getting Started**

### **Development**
```bash
npm install
npm run dev
```

### **Build Portable Exe**
```bash
./build-portable.bat
```

### **First Setup**
1. Run `Surgical-Inventory-System-portable.exe`
2. Right-click system tray → "Show Dashboard"
3. Click "Admin" → Add your categories and equipment
4. Print trigger barcodes: `SCAN_START`, `ACTIVATE`
5. Configure wireless scanner for keyboard emulation

## 🎨 **Design Philosophy**

**"Write on paper = Scan barcode"**

This system is designed to be **exactly as simple as your paper list**, but with all the benefits of digital:

- **Same physical action**: Instead of writing, you scan
- **Same simplicity**: No complex UI or decisions
- **Same speed**: Faster than writing by hand
- **Better reliability**: Never lost, always backed up

The system thinks for you - just scan and it handles the rest!

## 📱 **Admin Features (When Needed)**

### **Equipment Management**
- Scan barcode → Enter name → Select category
- Visual list of all equipment
- Search by barcode or name

### **Category Management**  
- Swedish surgical departments pre-configured
- Add custom categories with prefixes
- Color coding for visual organization

### **Reports & Export**
- View daily/weekly statistics
- Export to CSV for Excel
- Backup database

**Admin interface is only used for setup and maintenance - daily use requires no admin access!**
