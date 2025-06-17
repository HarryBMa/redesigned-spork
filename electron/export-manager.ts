import { app, dialog } from 'electron';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DatabaseManager, ScanLog } from './json-database';
import { format } from 'date-fns';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class ExportManager {
  private dbManager: DatabaseManager;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }
  async exportData(fileFormat: 'csv' | 'json', filters?: any): Promise<ExportResult> {
    try {
      const logs = await this.dbManager.getScanLogs(filters);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const fileName = `surgical-inventory-${timestamp}.${fileFormat}`;
      const filePath = join(app.getPath('documents'), fileName);

      let content: string;

      if (fileFormat === 'csv') {
        content = this.generateCSV(logs);
      } else {
        content = this.generateJSON(logs);
      }

      await writeFile(filePath, content, 'utf8');

      return {
        success: true,
        filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async exportWithDialog(fileFormat: 'csv' | 'json'): Promise<ExportResult> {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const defaultPath = `surgical-inventory-${timestamp}.${fileFormat}`;

      const result = await dialog.showSaveDialog({
        title: `Export as ${fileFormat.toUpperCase()}`,
        defaultPath,
        filters: [
          { 
            name: fileFormat.toUpperCase(), 
            extensions: [fileFormat] 
          },
          { 
            name: 'All Files', 
            extensions: ['*'] 
          }
        ]
      });

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          error: 'Export canceled'
        };
      }

      const logs = await this.dbManager.getScanLogs();
      let content: string;

      if (fileFormat === 'csv') {
        content = this.generateCSV(logs);
      } else {
        content = this.generateJSON(logs);
      }

      await writeFile(result.filePath, content, 'utf8');

      return {
        success: true,
        filePath: result.filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateCSV(logs: ScanLog[]): string {
    const headers = ['ID', 'Barcode', 'Category', 'Action', 'Timestamp', 'Metadata'];
    const csvLines = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.id?.toString() || '',
        `"${log.barcode}"`,
        `"${log.category}"`,
        log.action,
        log.timestamp.toISOString(),
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
      ];
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  private generateJSON(logs: ScanLog[]): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      totalRecords: logs.length,
      data: logs.map(log => ({
        id: log.id,
        barcode: log.barcode,
        category: log.category,
        action: log.action,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  async generateDailyReport(date?: Date): Promise<ExportResult> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const logs = await this.dbManager.getScanLogs({
        startDate: startOfDay,
        endDate: endOfDay
      });

      const statistics = await this.dbManager.getStatistics();
      
      const reportData = {
        date: format(targetDate, 'yyyy-MM-dd'),
        summary: {
          totalScans: logs.length,
          checkouts: logs.filter(l => l.action === 'checkout').length,
          checkins: logs.filter(l => l.action === 'checkin').length,
          categoriesUsed: new Set(logs.map(l => l.category)).size
        },
        categoryBreakdown: this.getCategoryBreakdown(logs),
        detailedLogs: logs
      };

      const fileName = `daily-report-${format(targetDate, 'yyyy-MM-dd')}.json`;
      const filePath = join(app.getPath('documents'), fileName);
      
      await writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf8');

      return {
        success: true,
        filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getCategoryBreakdown(logs: ScanLog[]): { [category: string]: { checkouts: number; checkins: number } } {
    const breakdown: { [category: string]: { checkouts: number; checkins: number } } = {};

    logs.forEach(log => {
      if (!breakdown[log.category]) {
        breakdown[log.category] = { checkouts: 0, checkins: 0 };
      }
      
      if (log.action === 'checkout') {
        breakdown[log.category].checkouts++;
      } else {
        breakdown[log.category].checkins++;
      }
    });

    return breakdown;
  }
}
