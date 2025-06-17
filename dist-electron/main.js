"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const os_1 = require("os");
const electron_store_1 = __importDefault(require("electron-store"));
const json_database_1 = require("./json-database");
const barcode_scanner_1 = require("./barcode-scanner");
const category_manager_1 = require("./category-manager");
const export_manager_1 = require("./export-manager");
// Set up persistent storage
const store = new electron_store_1.default();
let mainWindow = null;
let scanWindow = null;
let tray = null;
let isQuitting = false;
// Application state
let isScanning = false;
let scanTimeout = null;
const SCAN_TIMEOUT = store.get('scanTimeout', 10000); // Default 10 seconds
// Initialize managers
let dbManager;
let barcodeScanner;
let categoryManager;
let exportManager;
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
async function createMainWindow() {
    const win = new electron_1.BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
    });
    if (isDev && VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        win.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
    }
    return win;
}
async function createScanWindow() {
    const win = new electron_1.BrowserWindow({
        width: 500,
        height: 350,
        show: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        resizable: false,
        frame: true,
        title: 'Surgical Inventory Scanner',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
    });
    if (isDev && VITE_DEV_SERVER_URL) {
        win.loadURL(`${VITE_DEV_SERVER_URL}#/scan`);
    }
    else {
        win.loadFile((0, path_1.join)(__dirname, '../dist/index.html'), { hash: 'scan' });
    }
    return win;
}
function createTray() {
    const iconPath = (0, os_1.platform)() === 'win32'
        ? (0, path_1.join)(__dirname, '../assets/icon.ico')
        : (0, path_1.join)(__dirname, '../assets/icon.png');
    const trayIcon = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show Scanner',
            click: () => showScanWindow()
        },
        {
            label: 'Show Dashboard',
            click: () => showMainWindow()
        },
        { type: 'separator' },
        {
            label: 'Export Data',
            submenu: [
                {
                    label: 'Export CSV',
                    click: () => exportData('csv')
                },
                {
                    label: 'Export JSON',
                    click: () => exportData('json')
                }
            ]
        },
        {
            label: 'Settings',
            click: () => showSettings()
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                isQuitting = true;
                electron_1.app.quit();
            }
        }
    ]);
    trayIcon.setToolTip('Surgical Inventory System');
    trayIcon.setContextMenu(contextMenu);
    trayIcon.on('double-click', () => {
        showScanWindow();
    });
    return trayIcon;
}
async function showMainWindow() {
    if (!mainWindow) {
        mainWindow = await createMainWindow();
        mainWindow.on('close', (event) => {
            if (!isQuitting) {
                event.preventDefault();
                mainWindow?.hide();
            }
        });
    }
    mainWindow.show();
    mainWindow.focus();
}
async function showScanWindow() {
    if (!scanWindow) {
        scanWindow = await createScanWindow();
        scanWindow.on('close', () => {
            scanWindow = null;
            stopScanning();
        });
    }
    scanWindow.show();
    scanWindow.focus();
    startScanning();
}
function showSettings() {
    if (mainWindow) {
        mainWindow.webContents.send('navigate-to', '/settings');
        showMainWindow();
    }
}
function startScanning() {
    isScanning = true;
    resetScanTimeout();
    // Enable global shortcut for manual activation
    electron_1.globalShortcut.register('CommandOrControl+Shift+S', () => {
        if (scanWindow) {
            scanWindow.focus();
            resetScanTimeout();
        }
    });
}
function stopScanning() {
    isScanning = false;
    if (scanTimeout) {
        clearTimeout(scanTimeout);
        scanTimeout = null;
    }
    electron_1.globalShortcut.unregister('CommandOrControl+Shift+S');
}
function resetScanTimeout() {
    if (scanTimeout) {
        clearTimeout(scanTimeout);
    }
    scanTimeout = setTimeout(() => {
        if (scanWindow && isScanning) {
            scanWindow.close();
        }
    }, SCAN_TIMEOUT);
}
async function exportData(format) {
    try {
        const result = await exportManager.exportData(format);
        if (result.success) {
            electron_1.shell.showItemInFolder(result.filePath);
        }
    }
    catch (error) {
        console.error('Export failed:', error);
    }
}
// IPC Handlers
function setupIpcHandlers() {
    electron_1.ipcMain.handle('get-scan-logs', async (_, filters) => {
        return await dbManager.getScanLogs(filters);
    });
    electron_1.ipcMain.handle('get-statistics', async () => {
        return await dbManager.getStatistics();
    });
    electron_1.ipcMain.handle('process-barcode', async (_, barcode) => {
        resetScanTimeout(); // Reset timeout on scan activity
        const result = await barcodeScanner.processBarcode(barcode, dbManager);
        if (result.action === 'trigger') {
            if (!scanWindow) {
                await showScanWindow();
            }
            return { success: true, message: 'Scanner activated', trigger: true };
        }
        if (result.action === 'scan') {
            await dbManager.addScanLog({
                barcode: result.barcode,
                category: result.category,
                action: result.scanType,
                timestamp: new Date(),
                metadata: result.metadata
            });
            // Auto-close scan window after successful scan (ultra-simple workflow)
            if (scanWindow) {
                setTimeout(() => {
                    if (scanWindow) {
                        scanWindow.close();
                    }
                }, 3000); // Show result for 3 seconds then close
            }
            return {
                success: true,
                message: `${result.scanType?.toUpperCase()} - ${result.category}`,
                scan: result
            };
        }
        return { success: false, message: 'Unknown barcode format' };
    });
    electron_1.ipcMain.handle('export-data', async (_, fileFormat) => {
        return await exportManager.exportData(fileFormat);
    });
    electron_1.ipcMain.handle('get-settings', () => {
        return {
            scanTimeout: store.get('scanTimeout', 10000),
            categories: store.get('categories', {}),
            triggerBarcodes: store.get('triggerBarcodes', ['SCAN_START', 'ACTIVATE'])
        };
    });
    electron_1.ipcMain.handle('save-settings', (_, settings) => {
        store.set('scanTimeout', settings.scanTimeout);
        store.set('categories', settings.categories);
        store.set('triggerBarcodes', settings.triggerBarcodes);
        return { success: true };
    });
    electron_1.ipcMain.handle('close-scan-window', () => {
        if (scanWindow) {
            scanWindow.close();
        }
    });
    electron_1.ipcMain.handle('minimize-to-tray', () => {
        if (mainWindow) {
            mainWindow.hide();
        }
    });
}
electron_1.app.whenReady().then(async () => {
    // Initialize managers
    dbManager = new json_database_1.DatabaseManager();
    await dbManager.initialize();
    categoryManager = new category_manager_1.CategoryManager(store);
    barcodeScanner = new barcode_scanner_1.BarcodeScanner(categoryManager);
    exportManager = new export_manager_1.ExportManager(dbManager);
    // Set up IPC handlers
    setupIpcHandlers();
    // Create system tray
    tray = createTray();
    // Register global hotkey for quick activation
    electron_1.globalShortcut.register('CommandOrControl+Alt+S', () => {
        showScanWindow();
    });
    // Prevent the app from showing in dock/taskbar on macOS
    if ((0, os_1.platform)() === 'darwin') {
        electron_1.app.dock?.hide();
    }
});
electron_1.app.on('window-all-closed', () => {
    // Keep the app running in the background
    if ((0, os_1.platform)() !== 'darwin') {
        // Don't quit, just hide
    }
});
electron_1.app.on('activate', () => {
    showScanWindow();
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
    electron_1.globalShortcut.unregisterAll();
});
// Handle the app being started with a barcode scanner input
electron_1.app.on('ready', () => {
    // Listen for barcode input globally when the app starts
    if (process.argv.length > 1) {
        const potentialBarcode = process.argv[process.argv.length - 1];
        if (potentialBarcode && potentialBarcode.length > 3) {
            setTimeout(() => {
                barcodeScanner.processBarcode(potentialBarcode);
            }, 1000);
        }
    }
});
