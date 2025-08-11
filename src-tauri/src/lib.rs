// Surgical Inventory Tracker - Tauri Backend
mod database;
mod scanner;
mod logger;
mod export;
mod alert;
mod tray;
mod printer;

use database::{Database, ScanLog, DepartmentMapping, InventoryItem};
use logger::Logger;
use scanner::Scanner;
use export::Exporter;
use alert::{AlertManager, OverdueItem, DepartmentAlert};
use tray::TrayManager;
use serial_scanner::{SerialScanner, start_serial_scanner_thread};
use printer::{ZebraPrinter, PrinterSettings};

use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State, Emitter, Manager};
use serde_json::Value;


// Application State
struct AppState {
    logger: Arc<Mutex<Logger>>,
    scanner: Arc<Mutex<Scanner>>,
    serial_scanner: Arc<Mutex<SerialScanner>>,
}

impl AppState {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {        Ok(AppState {
            logger: Arc::new(Mutex::new(Logger::new()?)),
            scanner: Arc::new(Mutex::new(scanner::Scanner::new())),
        })
    }
}

// Tauri Commands

#[tauri::command]
fn get_recent_logs(state: State<AppState>, limit: Option<i64>) -> Result<Vec<ScanLog>, String> {
    let logger = state.logger.lock().map_err(|e| e.to_string())?;
    logger.get_recent_logs(limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_checked_out_items(state: State<AppState>) -> Result<Vec<ScanLog>, String> {
    let logger = state.logger.lock().map_err(|e| e.to_string())?;
    logger.get_checked_out_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_department_stats(state: State<AppState>) -> Result<Vec<(String, i64)>, String> {
    let logger = state.logger.lock().map_err(|e| e.to_string())?;
    logger.get_department_stats().map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_all_logs(state: State<AppState>) -> Result<(), String> {
    let logger = state.logger.lock().map_err(|e| e.to_string())?;
    logger.clear_all_logs().map_err(|e| e.to_string())
}

// Database maintenance commands
#[tauri::command]
fn cleanup_old_logs(days_to_keep: i32) -> Result<usize, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.cleanup_old_logs(days_to_keep).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_database_stats() -> Result<Value, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    let (total_logs, file_size) = db.get_database_stats().map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "total_logs": total_logs,
        "file_size": file_size
    }))
}

#[tauri::command]
fn archive_completed_transactions(days_to_keep: i32) -> Result<usize, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.archive_completed_transactions(days_to_keep).map_err(|e| e.to_string())
}

#[tauri::command]
fn manual_scan_barcode(app: AppHandle, state: State<AppState>, barcode: String) -> Result<Value, String> {
    let mut logger = state.logger.lock().map_err(|e| e.to_string())?;
    let action = logger.process_barcode_scan(&barcode).map_err(|e| e.to_string())?;
    
    let result = serde_json::json!({
        "barcode": barcode,
        "action": action.action,
        "department": action.department
    });

    // Emit event to notify UI components of the scan
    let _ = app.emit("barcode-scanned", &result);
    
    Ok(result)
}

#[tauri::command]
fn force_check_in(state: State<AppState>, barcode: String) -> Result<Value, String> {
    let mut logger = state.logger.lock().map_err(|e| e.to_string())?;
    let action = logger.force_check_in(&barcode).map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "barcode": barcode,
        "action": action.action,
        "department": action.department
    }))
}

#[tauri::command]
fn force_check_out(state: State<AppState>, barcode: String) -> Result<Value, String> {
    let mut logger = state.logger.lock().map_err(|e| e.to_string())?;
    let action = logger.force_check_out(&barcode).map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "barcode": barcode,
        "action": action.action,
        "department": action.department
    }))
}

#[tauri::command]
fn start_manual_scan_session(state: State<AppState>) -> Result<(), String> {
    let mut scanner = state.scanner.lock().map_err(|e| e.to_string())?;
    scanner.start_manual_session();
    Ok(())
}

#[tauri::command]
fn stop_scan_session(state: State<AppState>) -> Result<(), String> {
    let mut scanner = state.scanner.lock().map_err(|e| e.to_string())?;
    scanner.stop_session();
    Ok(())
}

#[tauri::command]
fn export_logs_csv(file_path: String, limit: Option<i64>) -> Result<(), String> {
    let exporter = Exporter::new().map_err(|e| e.to_string())?;
    exporter.export_logs_to_csv(&file_path, limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_logs_json(file_path: String, limit: Option<i64>) -> Result<(), String> {
    let exporter = Exporter::new().map_err(|e| e.to_string())?;
    exporter.export_logs_to_json(&file_path, limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_checked_out_csv(file_path: String) -> Result<(), String> {
    let exporter = Exporter::new().map_err(|e| e.to_string())?;
    exporter.export_checked_out_to_csv(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn quick_export_checked_out() -> Result<String, String> {
    let exporter = Exporter::new().map_err(|e| e.to_string())?;
    let export_path = Exporter::get_default_export_path();
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let file_path = export_path.join(format!("utcheckade_artiklar_{}.csv", timestamp));
    
    exporter.export_checked_out_to_csv(file_path.to_str().unwrap()).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_overdue_items() -> Result<Vec<OverdueItem>, String> {
    let alert_manager = AlertManager::new().map_err(|e| e.to_string())?;
    alert_manager.check_overdue_items().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_department_alerts() -> Result<Vec<DepartmentAlert>, String> {
    let alert_manager = AlertManager::new().map_err(|e| e.to_string())?;
    alert_manager.get_department_alert_stats().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_settings(key: String) -> Result<Option<String>, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_settings(key: String, value: String) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_department_mappings() -> Result<Vec<DepartmentMapping>, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.get_department_mappings().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_department_mapping(prefix: String, department: String) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.set_department_mapping(&prefix, &department).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_department_mapping(prefix: String) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.delete_department_mapping(&prefix).map_err(|e| e.to_string())
}

// Items (inventory catalogue) commands
#[tauri::command]
fn get_items(limit: Option<i64>) -> Result<Vec<InventoryItem>, String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.get_items(limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_item(barcode: String, department: Option<String>, description: Option<String>) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.add_item(&barcode, department.as_deref(), description.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_item(barcode: String, department: Option<String>, description: Option<String>) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.update_item(&barcode, department.as_deref(), description.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_item(barcode: String) -> Result<(), String> {
    let db = Database::new().map_err(|e| e.to_string())?;
    db.delete_item(&barcode).map_err(|e| e.to_string())
}

// Window Management Commands
#[tauri::command]
fn close_window(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_window(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Serial Scanner Commands
#[tauri::command]
fn open_serial_scanner(app: tauri::AppHandle, state: State<AppState>, port: String, baud: u32) -> Result<(), String> {
    let mut scanner = state.serial_scanner.lock().map_err(|e| e.to_string())?;
    scanner.close();
    scanner.open(&port, baud)?;
    let scanner_clone = state.serial_scanner.clone();
    start_serial_scanner_thread(scanner_clone, app);
    Ok(())
}

#[tauri::command]
fn close_serial_scanner(state: State<AppState>) {
    let mut scanner = state.serial_scanner.lock().unwrap();
    scanner.close();
}

#[tauri::command]
fn show_quick_scan_popup(app: AppHandle) -> Result<(), String> {
    TrayManager::show_quick_scan_popup(&app).map_err(|e| e.to_string())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage({
            match AppState::new() {
                Ok(state) => state,
                Err(e) => {
                    eprintln!("Failed to initialize app state: {}", e);
                    std::process::exit(1);
                }
            }
        })        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Apply window vibrancy effects
            apply_window_vibrancy(app.handle());
            
            // Setup system tray
            if let Err(e) = TrayManager::setup_system_tray(app.handle()) {
                eprintln!("Failed to setup system tray: {}", e);
            }

            // Perform automatic database cleanup on startup (keep 30 days of completed transactions)
            if let Ok(db) = Database::new() {
                match db.archive_completed_transactions(30) {
                    Ok(deleted_count) => {
                        if deleted_count > 0 {
                            println!("Database cleanup: Archived {} old completed transactions", deleted_count);
                        }
                    }
                    Err(e) => eprintln!("Failed to perform database cleanup: {}", e),
                }
            }

            // Start keyboard scanner
            if let Err(e) = scanner::Scanner::start_listening(app.handle().clone()) {
                eprintln!("Failed to start keyboard scanner: {}", e);
            }

            // Start periodic alert checks
            if let Err(e) = AlertManager::start_periodic_checks(app.handle().clone()) {
                eprintln!("Failed to start alert manager: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Core inventory commands
            get_recent_logs,
            get_checked_out_items,
            get_department_stats,
            clear_all_logs,
            manual_scan_barcode,
            force_check_in,
            force_check_out,
            
            // Database maintenance commands
            cleanup_old_logs,
            get_database_stats,
            archive_completed_transactions,
            
                    
            // Scanner commands
            start_manual_scan_session,
            stop_scan_session,
            
            // Window management commands
            close_window,
            hide_window,
            
            // Export commands
            export_logs_csv,
            export_logs_json,
            export_checked_out_csv,
            quick_export_checked_out,
            quick_export_checked_out,
            
            // Alert commands
            get_overdue_items,
            get_department_alerts,
            
            // Settings commands
            get_settings,
            set_settings,
            get_department_mappings,
            set_department_mapping,
            delete_department_mapping,
            // Items
            get_items,
            add_item,
            update_item,
            delete_item,
            
            
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
