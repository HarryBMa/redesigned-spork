"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    getScanLogs: (filters) => electron_1.ipcRenderer.invoke('get-scan-logs', filters),
    getStatistics: () => electron_1.ipcRenderer.invoke('get-statistics'),
    // Barcode scanning
    processBarcode: (barcode) => electron_1.ipcRenderer.invoke('process-barcode', barcode),
    // Export functionality
    exportData: (format) => electron_1.ipcRenderer.invoke('export-data', format),
    // Settings
    getSettings: () => electron_1.ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('save-settings', settings),
    // Window management
    closeScanWindow: () => electron_1.ipcRenderer.invoke('close-scan-window'),
    showScanWindow: () => electron_1.ipcRenderer.invoke('show-scan-window'),
    minimizeToTray: () => electron_1.ipcRenderer.invoke('minimize-to-tray'),
    // Event listeners
    onNavigate: (callback) => {
        electron_1.ipcRenderer.on('navigate-to', (_, route) => callback(route));
    },
    // Remove listeners
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
});
