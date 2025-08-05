use crate::database::Database;
use csv::Writer;
use std::path::PathBuf;
use std::io::Write;
use serde_json;

pub struct Exporter {
    db: Database,
}

impl Exporter {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let db = Database::new()?;
        Ok(Exporter { db })
    }

    pub fn export_logs_to_csv(&self, file_path: &str, limit: Option<i64>) -> Result<(), Box<dyn std::error::Error>> {
        let logs = self.db.get_logs(limit)?;
        
        // Create file with UTF-8 BOM to ensure proper encoding
        let mut file = std::fs::File::create(file_path)?;
        file.write_all(&[0xEF, 0xBB, 0xBF])?; // UTF-8 BOM
        
        let mut wtr = Writer::from_writer(file);

        // Write header
        wtr.write_record(&["Timestamp", "Barcode", "Action", "Department"])?;

        // Write data
        for log in logs {
            wtr.write_record(&[
                log.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                log.barcode,
                log.action,
                log.department.unwrap_or_default(),
            ])?;
        }

        wtr.flush()?;
        Ok(())
    }

    pub fn export_logs_to_json(&self, file_path: &str, limit: Option<i64>) -> Result<(), Box<dyn std::error::Error>> {
        let logs = self.db.get_logs(limit)?;
        let json = serde_json::to_string_pretty(&logs)?;
        // Explicitly write as UTF-8
        std::fs::write(file_path, json.as_bytes())?;
        Ok(())
    }

    pub fn export_checked_out_to_csv(&self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let items = self.db.get_checked_out_items()?;
        
        // Create file with UTF-8 BOM to ensure proper encoding
        let mut file = std::fs::File::create(file_path)?;
        file.write_all(&[0xEF, 0xBB, 0xBF])?; // UTF-8 BOM
        
        let mut wtr = Writer::from_writer(file);

        // Write header
        wtr.write_record(&["Streckkod", "Enhet", "Utcheckad tid"])?;

        // Write data
        for item in items {
           
            wtr.write_record(&[
                item.barcode,
                item.department.unwrap_or_default(),
                item.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
            ])?;
        }

        wtr.flush()?;
        Ok(())
    }

    pub fn get_default_export_path() -> PathBuf {
        let mut path = dirs::desktop_dir().unwrap_or_else(|| {
            // Fallback to Documents folder if Desktop is not available
            dirs::document_dir().unwrap_or_else(|| PathBuf::from("."))
        });
        path.push("HarrysLillaLager");
        
        // Ensure the directory exists
        if let Err(e) = std::fs::create_dir_all(&path) {
            eprintln!("Warning: Could not create export directory {:?}: {}", path, e);
            // Fallback to desktop or current directory
            path = dirs::desktop_dir().unwrap_or_else(|| PathBuf::from("."));
        }
        
        path
    }
}
