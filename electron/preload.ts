import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getScanLogs: (filters?: any) => ipcRenderer.invoke('get-scan-logs', filters),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  
  // Barcode scanning
  processBarcode: (barcode: string) => ipcRenderer.invoke('process-barcode', barcode),
  
  // Export functionality
  exportData: (format: 'csv' | 'json') => ipcRenderer.invoke('export-data', format),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    // Window management
  closeScanWindow: () => ipcRenderer.invoke('close-scan-window'),
  showScanWindow: () => ipcRenderer.invoke('show-scan-window'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  
  // Event listeners
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate-to', (_, route) => callback(route));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Types for the exposed API
export interface ElectronAPI {
  getScanLogs: (filters?: any) => Promise<any[]>;
  getStatistics: () => Promise<any>;
  processBarcode: (barcode: string) => Promise<any>;
  exportData: (format: 'csv' | 'json') => Promise<any>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<any>;
  closeScanWindow: () => Promise<void>;
  minimizeToTray: () => Promise<void>;
  onNavigate: (callback: (route: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
