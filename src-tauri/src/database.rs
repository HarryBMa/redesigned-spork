use rusqlite::{params, Connection, Result};
use chrono::{DateTime, Local,};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanLog {
    pub id: Option<i64>,
    pub timestamp: DateTime<Local>,
    pub barcode: String,
    pub action: String, // "check-in" or "check-out"
    pub department: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepartmentMapping {
    pub prefix: String,
    pub department: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItem {
    pub barcode: String,
    pub department: Option<String>,
    pub description: Option<String>,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();
        let conn = Connection::open(&db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        // Get the executable's directory for network drive compatibility
        let mut path = std::env::current_exe()
            .map(|p| p.parent().unwrap_or(std::path::Path::new(".")).to_path_buf())
            .unwrap_or_else(|_| PathBuf::from("."));
        
        // Create a data subfolder next to the executable
        path.push("data");
        std::fs::create_dir_all(&path).unwrap_or_default();
        path.push("inventory.db");
        path
    }

    fn init_tables(&self) -> Result<()> {
        // Create logs table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                barcode TEXT NOT NULL,
                action TEXT CHECK(action IN ('check-in', 'check-out')) NOT NULL,
                department TEXT
            )",
            [],
        )?;

        // Create settings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        // Create department mappings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS department_mappings (
                prefix TEXT PRIMARY KEY,
                department TEXT NOT NULL
            )",
            [],
        )?;

        // Create items table (managed inventory catalogue)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS items (
                barcode TEXT PRIMARY KEY,
                department TEXT,
                description TEXT
            )",
            [],
        )?;

        // Insert default department mappings only if table is empty
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM department_mappings",
            [],
            |row| row.get(0)
        )?;
        
        if count == 0 {
            self.conn.execute(
                "INSERT INTO department_mappings (prefix, department) VALUES 
                ('KÄKX', 'Käkkirurgi'),
                ('ORTX', 'Ortopedi'),
                ('NEURX', 'Neurokirurgi')",
                [],
            )?;
        }

        // Insert default settings
        self.conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('auto_export_enabled', 'false'),
            ('export_path', ''),
            ('alert_threshold_hours', '24'),
            ('trigger_barcode', 'SCAN_START')",
            [],
        )?;

        Ok(())
    }

    pub fn log_scan(&self, barcode: &str, action: &str, department: Option<&str>) -> Result<i64> {
        let timestamp = Local::now().to_rfc3339();
        let dept = department.map(|s| s.to_string());
        
        self.conn.execute(
            "INSERT INTO logs (timestamp, barcode, action, department) VALUES (?1, ?2, ?3, ?4)",
            params![timestamp, barcode, action, dept],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_logs(&self, limit: Option<i64>) -> Result<Vec<ScanLog>> {
        let sql = match limit {
            Some(l) => format!("SELECT id, timestamp, barcode, action, department FROM logs ORDER BY timestamp DESC LIMIT {}", l),
            None => "SELECT id, timestamp, barcode, action, department FROM logs ORDER BY timestamp DESC".to_string(),
        };

        let mut stmt = self.conn.prepare(&sql)?;
        let logs = stmt.query_map([], |row| {
            Ok(ScanLog {
                id: Some(row.get(0)?),
                timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                    .unwrap_or_else(|_| Local::now().into())
                    .with_timezone(&Local),
                barcode: row.get(2)?,
                action: row.get(3)?,
                department: row.get(4)?,
            })
        })?;

        let mut result = Vec::new();
        for log in logs {
            result.push(log?);
        }
        Ok(result)
    }

    pub fn get_checked_out_items(&self) -> Result<Vec<ScanLog>> {
        // Get all items that have been checked out but not checked back in
        let mut stmt = self.conn.prepare(
            "SELECT l1.id, l1.timestamp, l1.barcode, l1.action, l1.department 
             FROM logs l1 
             WHERE l1.action = 'check-out' 
             AND NOT EXISTS (
                 SELECT 1 FROM logs l2 
                 WHERE l2.barcode = l1.barcode 
                 AND l2.action = 'check-in' 
                 AND l2.timestamp > l1.timestamp
             )
             ORDER BY l1.timestamp DESC"
        )?;

        let logs = stmt.query_map([], |row| {
            Ok(ScanLog {
                id: Some(row.get(0)?),
                timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(1)?)
                    .unwrap_or_else(|_| Local::now().into())
                    .with_timezone(&Local),
                barcode: row.get(2)?,
                action: row.get(3)?,
                department: row.get(4)?,
            })
        })?;

        let mut result = Vec::new();
        for log in logs {
            result.push(log?);
        }
        Ok(result)
    }

    pub fn get_department_stats(&self) -> Result<Vec<(String, i64)>> {
        let mut stmt = self.conn.prepare(
            "SELECT 
                COALESCE(department, 'Unknown') as dept,
                COUNT(*) as count
             FROM logs l1 
             WHERE l1.action = 'check-out' 
             AND NOT EXISTS (
                 SELECT 1 FROM logs l2 
                 WHERE l2.barcode = l1.barcode 
                 AND l2.action = 'check-in' 
                 AND l2.timestamp > l1.timestamp
             )
             GROUP BY dept
             ORDER BY count DESC"
        )?;

        let stats = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;

        let mut result = Vec::new();
        for stat in stats {
            result.push(stat?);
        }
        Ok(result)
    }

    pub fn clear_logs(&self) -> Result<()> {
        self.conn.execute("DELETE FROM logs", [])?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_department_mappings(&self) -> Result<Vec<DepartmentMapping>> {
        let mut stmt = self.conn.prepare("SELECT prefix, department FROM department_mappings ORDER BY prefix")?;
        let mappings = stmt.query_map([], |row| {
            Ok(DepartmentMapping {
                prefix: row.get(0)?,
                department: row.get(1)?,
            })
        })?;

        let mut result = Vec::new();
        for mapping in mappings {
            result.push(mapping?);
        }
        Ok(result)
    }

    pub fn set_department_mapping(&self, prefix: &str, department: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO department_mappings (prefix, department) VALUES (?1, ?2)",
            params![prefix, department],
        )?;
        Ok(())
    }

    pub fn delete_department_mapping(&self, prefix: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM department_mappings WHERE prefix = ?1",
            params![prefix],
        )?;
        Ok(())
    }

    // ------------------ Items CRUD ------------------
    pub fn get_items(&self, limit: Option<i64>) -> Result<Vec<InventoryItem>> {
        let sql = match limit {
            Some(l) => format!("SELECT barcode, department, description FROM items ORDER BY barcode LIMIT {}", l),
            None => "SELECT barcode, department, description FROM items ORDER BY barcode".to_string(),
        };
        let mut stmt = self.conn.prepare(&sql)?;
        let items_iter = stmt.query_map([], |row| {
            Ok(InventoryItem {
                barcode: row.get(0)?,
                department: row.get(1)?,
                description: row.get(2)?,
            })
        })?;
        let mut items = Vec::new();
        for item in items_iter { items.push(item?); }
        Ok(items)
    }

    pub fn add_item(&self, barcode: &str, department: Option<&str>, description: Option<&str>) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO items (barcode, department, description) VALUES (?1, ?2, ?3)",
            params![barcode, department, description],
        )?;
        Ok(())
    }

    pub fn update_item(&self, barcode: &str, department: Option<&str>, description: Option<&str>) -> Result<()> {
        self.conn.execute(
            "UPDATE items SET department = ?2, description = ?3 WHERE barcode = ?1",
            params![barcode, department, description],
        )?;
        Ok(())
    }

    pub fn delete_item(&self, barcode: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM items WHERE barcode = ?1",
            params![barcode],
        )?;
        Ok(())
    }

    pub fn get_department_from_barcode(&self, barcode: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT department FROM department_mappings WHERE ?1 LIKE prefix || '%' ORDER BY LENGTH(prefix) DESC LIMIT 1"
        )?;
        
        let mut rows = stmt.query_map(params![barcode], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }

    /// Clean up old logs to prevent infinite database growth
    /// Removes logs older than specified days, keeping only logs that have active check-outs
    pub fn cleanup_old_logs(&self, days_to_keep: i32) -> Result<usize> {
        // Calculate the cutoff date
        let cutoff_date = Local::now() - chrono::Duration::days(days_to_keep as i64);
        let cutoff_timestamp = cutoff_date.to_rfc3339();
        
        // Delete old logs that are not part of currently checked-out items
        let deleted_count = self.conn.execute(
            "DELETE FROM logs 
             WHERE timestamp < ?1 
             AND NOT EXISTS (
                 SELECT 1 FROM logs current_out 
                 WHERE current_out.barcode = logs.barcode 
                 AND current_out.action = 'check-out'
                 AND NOT EXISTS (
                     SELECT 1 FROM logs check_in 
                     WHERE check_in.barcode = current_out.barcode 
                     AND check_in.action = 'check-in' 
                     AND check_in.timestamp > current_out.timestamp
                 )
             )",
            params![cutoff_timestamp],
        )?;
        
        Ok(deleted_count)
    }

    /// Get database statistics including total logs and size
    pub fn get_database_stats(&self) -> Result<(i64, String)> {
        // Get total log count
        let mut stmt = self.conn.prepare("SELECT COUNT(*) FROM logs")?;
        let total_logs: i64 = stmt.query_row([], |row| row.get(0))?;
        
        // Get database file size
        let db_path = Self::get_db_path();
        let file_size = std::fs::metadata(&db_path)
            .map(|m| m.len())
            .unwrap_or(0);
        
        let size_mb = file_size as f64 / (1024.0 * 1024.0);
        let size_str = if size_mb > 1.0 {
            format!("{:.2} MB", size_mb)
        } else {
            format!("{:.2} KB", file_size as f64 / 1024.0)
        };
        
        Ok((total_logs, size_str))
    }

    /// Get item name by barcode
    pub fn get_item_name(&self, barcode: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT name FROM item_names WHERE barcode = ?1")?;
        match stmt.query_row(params![barcode.to_uppercase()], |row| {
            Ok(row.get::<_, String>(0)?)
        }) {
            Ok(name) => Ok(Some(name)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Set item name for barcode
    pub fn set_item_name(&self, barcode: &str, name: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO item_names (barcode, name) VALUES (?1, ?2)",
            params![barcode.to_uppercase(), name],
        )?;
        Ok(())
    }

    /// Import multiple item names from a list
    pub fn import_item_names(&self, items: &[(String, String)]) -> Result<usize> {
        let tx = self.conn.unchecked_transaction()?;
        let mut count = 0;
        
        for (barcode, name) in items {
            tx.execute(
                "INSERT OR REPLACE INTO item_names (barcode, name) VALUES (?1, ?2)",
                params![barcode.to_uppercase(), name],
            )?;
            count += 1;
        }
        
        tx.commit()?;
        Ok(count)
    }

    /// Get formatted display name for barcode (name + barcode or just barcode)
    pub fn get_display_name(&self, barcode: &str) -> Result<String> {
        match self.get_item_name(barcode)? {
            Some(name) => Ok(format!("{} ({})", name.to_uppercase(), barcode.to_uppercase())),
            None => Ok(barcode.to_uppercase()),
        }
    }

    /// Archive old completed transactions (check-out followed by check-in pairs)
    /// This keeps the database lean while preserving important data
    pub fn archive_completed_transactions(&self, days_to_keep: i32) -> Result<usize> {
        let cutoff_date = Local::now() - chrono::Duration::days(days_to_keep as i64);
        let cutoff_timestamp = cutoff_date.to_rfc3339();
        
        // Delete old check-in/check-out pairs that are completed
        let deleted_count = self.conn.execute(
            "DELETE FROM logs 
             WHERE timestamp < ?1 
             AND barcode IN (
                 SELECT DISTINCT barcode FROM logs completed
                 WHERE completed.action = 'check-in' 
                 AND completed.timestamp < ?1
                 AND EXISTS (
                     SELECT 1 FROM logs checkout 
                     WHERE checkout.barcode = completed.barcode 
                     AND checkout.action = 'check-out' 
                     AND checkout.timestamp < completed.timestamp
                 )
             )",
            params![cutoff_timestamp],
        )?;
        
        Ok(deleted_count)
    }
}
