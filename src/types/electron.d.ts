// Global type definitions for the Electron API

export interface ScanLog {
  id: number;
  barcode: string;
  category: string;
  action: 'checkout' | 'checkin';
  timestamp: Date;
  metadata?: any;
}

export interface Statistics {
  totalScans: number;
  checkouts: number;
  checkins: number;
  categoriesUsed: number;
  todayScans: number;
  categories: { [key: string]: number };
}

export interface ScanResult {
  success: boolean;
  message: string;
  trigger?: boolean;
  scan?: {
    barcode: string;
    category: string;
    scanType: 'checkout' | 'checkin';
  };
}

export interface AppSettings {
  scanTimeout: number;
  categories: { [key: string]: Category };
  triggerBarcodes: string[];
}

export interface Category {
  id?: number;
  name: string;
  prefix: string;
  description?: string;
  color?: string;
}

export interface Equipment {
  id?: number;
  barcode: string;
  name: string;
  category: string;
  description?: string;
  status: 'available' | 'checked_out' | 'maintenance';
  created_at?: Date;
}

export interface ElectronAPI {
  getScanLogs: (filters?: any) => Promise<ScanLog[]>;
  getStatistics: () => Promise<Statistics>;
  processBarcode: (barcode: string) => Promise<ScanResult>;  exportData: (format: 'csv' | 'json') => Promise<{ success: boolean; filePath?: string; error?: string }>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<{ success: boolean }>;
  closeScanWindow: () => Promise<void>;
  showScanWindow: () => Promise<void>;
  minimizeToTray: () => Promise<void>;
  
  // Equipment management
  getEquipment: () => Promise<Equipment[]>;
  addEquipment: (equipment: Equipment) => Promise<Equipment>;
  updateEquipment: (equipment: Equipment) => Promise<Equipment>;
  deleteEquipment: (id: number) => Promise<void>;
  
  // Category management
  getCategories: () => Promise<Category[]>;
  addCategory: (category: Category) => Promise<Category>;
  updateCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Navigation
  showDashboard: () => Promise<void>;
  showAdmin: () => Promise<void>;
  
  onNavigate: (callback: (route: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
