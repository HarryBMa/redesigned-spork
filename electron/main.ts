import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, shell } from 'electron';
import { join } from 'path';
import { platform } from 'os';
import Store from 'electron-store';
import { DatabaseManager } from './json-database';
import { BarcodeScanner } from './barcode-scanner';
import { CategoryManager } from './category-manager';
import { ExportManager } from './export-manager';

// Set up persistent storage
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let scanWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Application state
let isScanning = false;
let scanTimeout: NodeJS.Timeout | null = null;
const SCAN_TIMEOUT = store.get('scanTimeout', 10000) as number; // Default 10 seconds

// Initialize managers
let dbManager: DatabaseManager;
let barcodeScanner: BarcodeScanner;
let categoryManager: CategoryManager;
let exportManager: ExportManager;

const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

async function createMainWindow(): Promise<BrowserWindow> {
  const win = new BrowserWindow({
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
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (isDev && VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'));
  }

  return win;
}

async function createScanWindow(): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 500,
    height: 350,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    frame: true,
    title: 'Harrys lilla Lager - Scanner',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (isDev && VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}#/scan`);
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'), { hash: 'scan' });
  }

  return win;
}

function createTray(): Tray {
  const iconPath = platform() === 'win32' 
    ? join(__dirname, '../assets/icon.ico')
    : join(__dirname, '../assets/icon.png');

  const trayIcon = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Visa Scanner',
      click: () => showScanWindow()
    },
    {
      label: 'Visa Dashboard',
      click: () => showMainWindow()
    },
    { type: 'separator' },
    {
      label: 'Exportera Data',
      submenu: [
        {
          label: 'Exportera CSV',
          click: () => exportData('csv')
        },
        {
          label: 'Exportera JSON',
          click: () => exportData('json')
        }
      ]
    },
    {
      label: 'Inställningar',
      click: () => showSettings()
    },
    { type: 'separator' },
    {
      label: 'Avsluta',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  trayIcon.setToolTip('Harrys lilla Lager');
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
  globalShortcut.register('CommandOrControl+Shift+S', () => {
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
  globalShortcut.unregister('CommandOrControl+Shift+S');
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

async function exportData(format: 'csv' | 'json') {
  try {
    const result = await exportManager.exportData(format);
    if (result.success) {
      shell.showItemInFolder(result.filePath!);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// IPC Handlers
function setupIpcHandlers() {
  ipcMain.handle('get-scan-logs', async (_, filters) => {
    return await dbManager.getScanLogs(filters);
  });

  ipcMain.handle('get-statistics', async () => {
    return await dbManager.getStatistics();
  });
  ipcMain.handle('process-barcode', async (_, barcode: string) => {
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
        barcode: result.barcode!,
        category: result.category!,
        action: result.scanType!,
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
  ipcMain.handle('export-data', async (_, fileFormat: 'csv' | 'json') => {
    return await exportManager.exportData(fileFormat);
  });

  ipcMain.handle('get-settings', () => {
    return {
      scanTimeout: store.get('scanTimeout', 10000),
      categories: store.get('categories', {}),
      triggerBarcodes: store.get('triggerBarcodes', ['SCAN_START', 'ACTIVATE'])
    };
  });

  ipcMain.handle('save-settings', (_, settings) => {
    store.set('scanTimeout', settings.scanTimeout);
    store.set('categories', settings.categories);
    store.set('triggerBarcodes', settings.triggerBarcodes);
    return { success: true };
  });
  ipcMain.handle('close-scan-window', () => {
    if (scanWindow) {
      scanWindow.close();
    }
  });

  ipcMain.handle('show-scan-window', () => {
    showScanWindow();
  });

  ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });
}

app.whenReady().then(async () => {
  // Initialize managers
  dbManager = new DatabaseManager();
  await dbManager.initialize();
  
  categoryManager = new CategoryManager(store);
  barcodeScanner = new BarcodeScanner(categoryManager);
  exportManager = new ExportManager(dbManager);

  // Set up IPC handlers
  setupIpcHandlers();

  // Create system tray
  tray = createTray();

  // Register global hotkey for quick activation
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    showScanWindow();
  });

  // Prevent the app from showing in dock/taskbar on macOS
  if (platform() === 'darwin') {
    app.dock?.hide();
  }
});

app.on('window-all-closed', () => {
  // Keep the app running in the background
  if (platform() !== 'darwin') {
    // Don't quit, just hide
  }
});

app.on('activate', () => {
  showScanWindow();
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

// Handle the app being started with a barcode scanner input
app.on('ready', () => {
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
