use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton},
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    AppHandle, Manager, WebviewWindowBuilder, Emitter,
};

pub struct TrayManager;

impl TrayManager {
    pub fn setup_system_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        // Create menu items
        let show_admin = MenuItemBuilder::with_id("show_admin", "Open Admin Panel").build(app)?;
        let quick_scan = MenuItemBuilder::with_id("quick_scan", "Quick Scan").build(app)?;
        let start_scan = MenuItemBuilder::with_id("start_scan", "Start Scan Session").build(app)?;
        let export_data = MenuItemBuilder::with_id("export_data", "Export Data").build(app)?;
        let separator = PredefinedMenuItem::separator(app)?;
        let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

        // Build menu
        let menu = MenuBuilder::new(app)
            .item(&show_admin)
            .item(&separator)
            .item(&quick_scan)
            .item(&start_scan)
            .item(&separator)
            .item(&export_data)
            .item(&separator)
            .item(&quit)
            .build()?;

        // Build tray icon - using a black icon for better visibility
        let _tray = TrayIconBuilder::new()
            .menu(&menu)
            .icon(app.default_window_icon().unwrap().clone())
            .tooltip("Harry's Lilla Lager - Kirurgiskt lagersystem")
            .on_menu_event(move |app_handle, event| {
                match event.id().as_ref() {
                    "show_admin" => {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            let _ = Self::create_admin_window(app_handle);
                        }
                    }
                    "quick_scan" => {
                        let _ = Self::show_quick_scan_popup(app_handle);
                    }
                    "start_scan" => {
                        let _ = app_handle.emit("manual-scan-start", ());
                        println!("Manual scan session started from tray");
                    }
                    "export_data" => {
                        let _ = app_handle.emit("export-request", ());
                    }
                    "quit" => {
                        app_handle.exit(0);
                    }
                    _ => {}
                }
            })
            .on_tray_icon_event(|tray, event| {
                match event {
                    TrayIconEvent::Click { button: MouseButton::Left, .. } => {
                        // Single click shows quick scan popup
                        let _ = Self::show_quick_scan_popup(tray.app_handle());
                    }
                    TrayIconEvent::DoubleClick { button: MouseButton::Left, .. } => {
                        // Double click opens admin panel
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            let _ = Self::create_admin_window(tray.app_handle());
                        }
                    }
                    _ => {}
                }
            })
            .build(app)?;

        Ok(())
    }

    fn create_admin_window(app: &AppHandle) -> Result<(), tauri::Error> {
        let _window = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
            .title("Harry's Lilla Lager - Admin Panel")
            .inner_size(1200.0, 800.0)
            .min_inner_size(800.0, 600.0)
            .decorations(true)
            .transparent(false)
            .center()
            .focused(true)
            .build()?;

        #[cfg(debug_assertions)]
        _window.open_devtools();

        Ok(())
    }

    pub fn show_quick_scan_popup(app: &AppHandle) -> Result<(), tauri::Error> {
        // Check if popup already exists
        if let Some(popup) = app.get_webview_window("scan-popup") {
            // Ensure correct size and position for existing popup
            let _ = popup.set_size(tauri::Size::Physical(tauri::PhysicalSize { 
                width: 300, 
                height: 150 
            }));
            
            // Reposition existing popup to bottom-right corner
            if let Some(monitor) = popup.current_monitor()? {
                let monitor_size = monitor.size();
                let scale_factor = monitor.scale_factor();
                
                // Calculate position accounting for DPI scaling
                let popup_width = 300.0 * scale_factor;
                let popup_height = 150.0 * scale_factor;
                let margin = 20.0 * scale_factor; // Margin from screen edge
                
                let x = (monitor_size.width as f64) - popup_width - margin;
                let y = (monitor_size.height as f64) - popup_height - margin;
                
                let _ = popup.set_position(tauri::Position::Physical(tauri::PhysicalPosition { 
                    x: x as i32, 
                    y: y as i32 
                }));
            }
            
            let _ = popup.show();
            let _ = popup.set_focus();
            return Ok(());
        }

        // Create new popup window positioned in bottom-right corner
        let popup = WebviewWindowBuilder::new(app, "scan-popup", tauri::WebviewUrl::App("scan-popup".into()))
            .title("Quick Scan")
            .inner_size(300.0, 150.0)
            .decorations(true)
            .resizable(false)
            .always_on_top(true)
            .skip_taskbar(false)
            .transparent(false)
            .position(0.0, 0.0)  // Will be adjusted after creation
            .focused(true)
            .build()?;

        // Position popup in bottom-right corner
        if let Some(monitor) = popup.current_monitor()? {
            let monitor_size = monitor.size();
            let scale_factor = monitor.scale_factor();
            
            // Calculate position accounting for DPI scaling
            let popup_width = 300.0 * scale_factor;
            let popup_height = 150.0 * scale_factor;
            let margin = 20.0 * scale_factor; // Margin from screen edge
            
            let x = (monitor_size.width as f64) - popup_width - margin;
            let y = (monitor_size.height as f64) - popup_height - margin;
            
            let _ = popup.set_position(tauri::Position::Physical(tauri::PhysicalPosition { 
                x: x as i32, 
                y: y as i32 
            }));
        }



        Ok(())
    }
}
