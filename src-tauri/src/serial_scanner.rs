use std::sync::{Arc, Mutex};
use std::thread;
use std::io::Read;
use serialport::SerialPort;
use tauri::Emitter;

pub struct SerialScanner {
    pub port: Option<Box<dyn SerialPort>>,
    pub running: bool,
}

impl SerialScanner {
    pub fn new() -> Self {
        Self { port: None, running: false }
    }

    pub fn open(&mut self, port_name: &str, baud_rate: u32) -> Result<(), String> {
        match serialport::new(port_name, baud_rate).timeout(std::time::Duration::from_millis(100)).open() {
            Ok(port) => {
                self.port = Some(port);
                self.running = true;
                Ok(())
            },
            Err(e) => Err(format!("Failed to open serial port: {}", e)),
        }
    }

    pub fn close(&mut self) {
        self.port = None;
        self.running = false;
    }
}

pub fn start_serial_scanner_thread(scanner: Arc<Mutex<SerialScanner>>, app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        let mut buffer = [0u8; 256];
        while scanner.lock().unwrap().running {
            if let Some(ref mut port) = scanner.lock().unwrap().port {
                match port.read(&mut buffer) {
                    Ok(n) if n > 0 => {
                        let barcode = String::from_utf8_lossy(&buffer[..n]).trim().to_string();
                        if !barcode.is_empty() {
                            let _ = app_handle.emit("serial-barcode", barcode);
                        }
                    },
                    _ => {},
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
    });
}
