use crate::database::{Database, ScanLog};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ScanAction {
    pub action: String,
    pub department: Option<String>,
}

pub struct Logger {
    db: Database,
    checked_out_cache: HashMap<String, bool>,
}

impl Logger {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let db = Database::new()?;
        let mut logger = Logger {
            db,
            checked_out_cache: HashMap::new(),
        };
        logger.refresh_cache()?;
        Ok(logger)
    }

    fn refresh_cache(&mut self) -> Result<(), rusqlite::Error> {
        self.checked_out_cache.clear();
        let checked_out_items = self.db.get_checked_out_items()?;
        for item in checked_out_items {
            self.checked_out_cache.insert(item.barcode, true);
        }
        Ok(())
    }

    pub fn has_valid_department_prefix(&self, barcode: &str) -> bool {
        // Check if barcode starts with any valid department prefix
        match self.db.get_department_mappings() {
            Ok(mappings) => {
                for mapping in mappings {
                    if barcode.to_uppercase().starts_with(&mapping.prefix.to_uppercase()) {
                        return true;
                    }
                }
                false
            }
            Err(_) => false, // If we can't check, default to false to be safe
        }
    }

    pub fn process_barcode_scan(&mut self, barcode: &str) -> Result<ScanAction, Box<dyn std::error::Error>> {
        // Determine department from barcode prefix
        let department = self.db.get_department_from_barcode(barcode)?;
        
        // Reject barcodes that don't match any department prefix
        if department.is_none() {
            return Err("No matching department found for barcode prefix".into());
        }
        
        // Determine action based on current state
        let action = if self.checked_out_cache.contains_key(barcode) {
            // Item is currently checked out, so this is a check-in
            self.checked_out_cache.remove(barcode);
            "check-in"
        } else {
            // Item is not checked out, so this is a check-out
            self.checked_out_cache.insert(barcode.to_string(), true);
            "check-out"
        };

        // Log the scan to database
        self.db.log_scan(barcode, action, department.as_deref())?;

        Ok(ScanAction {
            action: action.to_string(),
            department,
        })
    }

    pub fn get_recent_logs(&self, limit: Option<i64>) -> Result<Vec<ScanLog>, rusqlite::Error> {
        self.db.get_logs(limit)
    }

    pub fn get_checked_out_items(&self) -> Result<Vec<ScanLog>, rusqlite::Error> {
        self.db.get_checked_out_items()
    }

    pub fn get_department_stats(&self) -> Result<Vec<(String, i64)>, rusqlite::Error> {
        self.db.get_department_stats()
    }

    pub fn clear_all_logs(&self) -> Result<(), rusqlite::Error> {
        self.db.clear_logs()
    }

    pub fn force_check_in(&mut self, barcode: &str) -> Result<ScanAction, Box<dyn std::error::Error>> {
        let department = self.db.get_department_from_barcode(barcode)?;
        
        // Reject barcodes that don't match any department prefix
        if department.is_none() {
            return Err("No matching department found for barcode prefix".into());
        }
        
        self.db.log_scan(barcode, "check-in", department.as_deref())?;
        self.checked_out_cache.remove(barcode);
        
        Ok(ScanAction {
            action: "check-in".to_string(),
            department,
        })
    }

    pub fn force_check_out(&mut self, barcode: &str) -> Result<ScanAction, Box<dyn std::error::Error>> {
        let department = self.db.get_department_from_barcode(barcode)?;
        
        // Reject barcodes that don't match any department prefix
        if department.is_none() {
            return Err("No matching department found for barcode prefix".into());
        }
        
        self.db.log_scan(barcode, "check-out", department.as_deref())?;
        self.checked_out_cache.insert(barcode.to_string(), true);
        
        Ok(ScanAction {
            action: "check-out".to_string(),
            department,
        })
    }
}
