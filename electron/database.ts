import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

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

export class DatabaseManager {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'surgical-inventory.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS scan_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT NOT NULL,
          category TEXT NOT NULL,
          action TEXT NOT NULL CHECK (action IN ('checkout', 'checkin')),
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_scan_logs_timestamp ON scan_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_scan_logs_category ON scan_logs(category);
        CREATE INDEX IF NOT EXISTS idx_scan_logs_action ON scan_logs(action);
        CREATE INDEX IF NOT EXISTS idx_scan_logs_barcode ON scan_logs(barcode);
      `;

      this.db.exec(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async addScanLog(log: ScanLog): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        INSERT INTO scan_logs (barcode, category, action, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      const metadata = log.metadata ? JSON.stringify(log.metadata) : null;

      this.db.run(sql, [
        log.barcode,
        log.category,
        log.action,
        log.timestamp.toISOString(),
        metadata
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getScanLogs(filters: ScanFilters = {}): Promise<ScanLog[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      let sql = 'SELECT * FROM scan_logs WHERE 1=1';
      const params: any[] = [];

      if (filters.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(filters.startDate.toISOString());
      }

      if (filters.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(filters.endDate.toISOString());
      }

      if (filters.category) {
        sql += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
      }

      sql += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const logs = rows.map(row => ({
            id: row.id,
            barcode: row.barcode,
            category: row.category,
            action: row.action,
            timestamp: new Date(row.timestamp),
            metadata: row.metadata ? JSON.parse(row.metadata) : null
          }));
          resolve(logs);
        }
      });
    });
  }

  async getStatistics(): Promise<Statistics> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const queries = [
        'SELECT COUNT(*) as count FROM scan_logs',
        'SELECT COUNT(*) as count FROM scan_logs WHERE action = "checkout"',
        'SELECT COUNT(*) as count FROM scan_logs WHERE action = "checkin"',
        'SELECT COUNT(DISTINCT category) as count FROM scan_logs',
        'SELECT COUNT(*) as count FROM scan_logs WHERE date(timestamp) = date("now")',
        'SELECT category, COUNT(*) as count FROM scan_logs GROUP BY category'
      ];

      Promise.all(queries.map(query => new Promise<any>((res, rej) => {
        this.db!.all(query, (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      }))).then(results => {
        const [total, checkouts, checkins, categoriesUsed, today, categoriesData] = results;

        const categories: { [key: string]: number } = {};
        categoriesData.forEach((row: any) => {
          categories[row.category] = row.count;
        });

        resolve({
          totalScans: total[0].count,
          checkouts: checkouts[0].count,
          checkins: checkins[0].count,
          categoriesUsed: categoriesUsed[0].count,
          todayScans: today[0].count,
          categories
        });
      }).catch(reject);
    });
  }

  async getLastScanForBarcode(barcode: string): Promise<ScanLog | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const sql = `
        SELECT * FROM scan_logs 
        WHERE barcode = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;

      this.db.get(sql, [barcode], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        const log: ScanLog = {
          id: row.id,
          barcode: row.barcode,
          category: row.category,
          action: row.action,
          timestamp: new Date(row.timestamp),
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };

        resolve(log);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
