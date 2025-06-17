import { join } from 'path';
import { app } from 'electron';
import { promises as fs } from 'fs';

export interface ScanLog {
  id?: number;
  barcode: string;
  category: string;
  action: 'checkout' | 'checkin';
  timestamp: Date;
  metadata?: any;
}

export interface ScanFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  action?: 'checkout' | 'checkin';
  limit?: number;
}

export interface Statistics {
  totalScans: number;
  checkouts: number;
  checkins: number;
  categoriesUsed: number;
  todayScans: number;
  categories: { [key: string]: number };
}

interface DatabaseData {
  scanLogs: ScanLog[];
  equipment: any[];
  categories: any[];
  nextId: number;
}

export class DatabaseManager {
  private dbPath: string;
  private data: DatabaseData = {
    scanLogs: [],
    equipment: [],
    categories: [],
    nextId: 1
  };

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'harrys-lilla-lager.json');
  }

  async initialize(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.dbPath, 'utf-8');
      this.data = JSON.parse(fileContent);
      
      // Convert timestamp strings back to Date objects
      this.data.scanLogs = this.data.scanLogs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      // File doesn't exist or is corrupted, start with empty data
      console.log('Creating new database file');
      await this.saveData();
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  async addScanLog(log: ScanLog): Promise<number> {
    const newLog: ScanLog = {
      ...log,
      id: this.data.nextId++,
      timestamp: new Date(log.timestamp)
    };
    
    this.data.scanLogs.push(newLog);
    await this.saveData();
    
    return newLog.id!;
  }

  async getScanLogs(filters: ScanFilters = {}): Promise<ScanLog[]> {
    let filteredLogs = [...this.data.scanLogs];

    // Apply filters
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  async getLastScanForBarcode(barcode: string): Promise<ScanLog | null> {
    const logs = this.data.scanLogs
      .filter(log => log.barcode === barcode)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return logs[0] || null;
  }

  async getStatistics(): Promise<Statistics> {
    const logs = this.data.scanLogs;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayLogs = logs.filter(log => log.timestamp >= todayStart);
    
    const categories: { [key: string]: number } = {};
    logs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
    });

    return {
      totalScans: logs.length,
      checkouts: logs.filter(log => log.action === 'checkout').length,
      checkins: logs.filter(log => log.action === 'checkin').length,
      categoriesUsed: Object.keys(categories).length,
      todayScans: todayLogs.length,
      categories
    };
  }

  async close(): Promise<void> {
    // Save final state
    await this.saveData();
  }
}
