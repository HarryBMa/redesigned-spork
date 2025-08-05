use crate::database::Database;
use chrono::{Duration, Local};
use tauri::{AppHandle, Emitter};

pub struct AlertManager {
    db: Database,
    threshold_hours: i64,
}

impl AlertManager {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let db = Database::new()?;
        let threshold_hours = db.get_setting("alert_threshold_hours")?
            .and_then(|s| s.parse().ok())
            .unwrap_or(24);

        Ok(AlertManager {
            db,
            threshold_hours,
        })
    }

    pub fn check_overdue_items(&self) -> Result<Vec<OverdueItem>, rusqlite::Error> {
        let checked_out_items = self.db.get_checked_out_items()?;
        let now = Local::now();
        let threshold = Duration::hours(self.threshold_hours);
        
        let mut overdue_items = Vec::new();
        
        for item in checked_out_items {
            let time_out = now.signed_duration_since(item.timestamp);
            if time_out > threshold {
                overdue_items.push(OverdueItem {
                    barcode: item.barcode,
                    department: item.department,
                    checked_out_time: item.timestamp.into(),
                    hours_overdue: time_out.num_hours(),
                });
            }
        }
        
        Ok(overdue_items)
    }

    pub fn send_overdue_alerts(&self, app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let overdue_items = self.check_overdue_items()?;
        
        if !overdue_items.is_empty() {
            let alert_data = serde_json::json!({
                "type": "overdue_items",
                "count": overdue_items.len(),
                "items": overdue_items,
                "threshold_hours": self.threshold_hours
            });
            
            let _ = app_handle.emit("overdue-alert", alert_data);
            println!("Sent overdue alert for {} items", overdue_items.len());
        }
        
        Ok(())
    }

    pub fn start_periodic_checks(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_secs(3600)); // Check every hour
                
                if let Ok(alert_manager) = AlertManager::new() {
                    if let Err(e) = alert_manager.send_overdue_alerts(&app_handle) {
                        eprintln!("Error sending overdue alerts: {}", e);
                    }
                }
            }
        });
        
        Ok(())
    }

    pub fn get_department_alert_stats(&self) -> Result<Vec<DepartmentAlert>, rusqlite::Error> {
        let overdue_items = self.check_overdue_items().unwrap_or_default();
        let mut dept_stats = std::collections::HashMap::new();
          for item in overdue_items {
            let dept = item.department.clone().unwrap_or_else(|| "Unknown".to_string());
            let entry = dept_stats.entry(dept.clone()).or_insert(DepartmentAlert {
                department: dept,
                overdue_count: 0,
                oldest_hours: 0,
            });
            entry.overdue_count += 1;
            entry.oldest_hours = entry.oldest_hours.max(item.hours_overdue);
        }
        
        let mut result: Vec<DepartmentAlert> = dept_stats.into_values().collect();
        result.sort_by(|a, b| b.overdue_count.cmp(&a.overdue_count));
        
        Ok(result)
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct OverdueItem {
    pub barcode: String,
    pub department: Option<String>,
    pub checked_out_time: chrono::DateTime<chrono::Utc>,
    pub hours_overdue: i64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DepartmentAlert {
    pub department: String,
    pub overdue_count: i64,
    pub oldest_hours: i64,
}
