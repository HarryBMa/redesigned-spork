use rdev::{listen, Event, EventType, Key};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use crate::database::Database;
use crate::logger::Logger;

pub struct Scanner {
    pub last_input: Instant,
    pub is_scanning: bool,
    pub trigger_barcode: String,
    pub session_timeout_ms: u64,
}

impl Default for Scanner {
    fn default() -> Self {
        Self {
            last_input: Instant::now(),
            is_scanning: false,
            trigger_barcode: "SCAN_START".to_string(),
            session_timeout_ms: 10000, // Session times out after 10 seconds
        }
    }
}

impl Scanner {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn start_listening(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let scanner = Arc::new(Mutex::new(Scanner::new()));
        let logger = Arc::new(Mutex::new(Logger::new()?));
        
        // Load trigger barcode from settings
        if let Ok(db) = Database::new() {
            if let Ok(Some(trigger)) = db.get_setting("trigger_barcode") {
                if let Ok(mut s) = scanner.lock() {
                    s.trigger_barcode = trigger;
                }
            }
        }

        let scanner_clone = Arc::clone(&scanner);
        let logger_clone = Arc::clone(&logger);
        let app_clone = app_handle.clone();

        std::thread::spawn(move || {
            let mut char_buffer = String::new();
            let mut last_char_time = Instant::now();
            let mut burst_detected = false;

            if let Err(error) = listen(move |event: Event| {
                if let EventType::KeyPress(key) = event.event_type {
                    let now = Instant::now();
                    
                    // Handle Enter key (end of barcode)
                    if key == Key::Return || key == Key::Num0 {
                        let barcode = char_buffer.trim().to_string();
                        char_buffer.clear();
                        
                        if !barcode.is_empty() {
                            if let Ok(mut scanner) = scanner_clone.lock() {
                                if barcode == scanner.trigger_barcode {
                                    // Trigger barcode detected - start scan session
                                    scanner.is_scanning = true;
                                    scanner.last_input = now;
                                    let _ = app_clone.emit("scan-session-started", ());
                                    println!("Scan session started by trigger barcode");
                                } else if scanner.is_scanning || burst_detected {
                                    // CRITICAL FIX: Only process if barcode has valid department prefix
                                    if let Ok(logger) = logger_clone.lock() {
                                        // Check if barcode has valid department prefix before processing
                                        if logger.has_valid_department_prefix(&barcode) {
                                            drop(logger); // Release lock before processing
                                            if let Ok(mut logger) = logger_clone.lock() {
                                                match logger.process_barcode_scan(&barcode) {
                                                    Ok(action) => {
                                                        let _ = app_clone.emit("barcode-scanned", serde_json::json!({
                                                            "barcode": barcode,
                                                            "action": action.action,
                                                            "department": action.department
                                                        }));
                                                        println!("Processed barcode: {} - {}", barcode, action.action);
                                                    }
                                                    Err(e) => {
                                                        eprintln!("Error processing barcode {}: {}", barcode, e);
                                                    }
                                                }
                                            }
                                        } else {
                                            println!("Ignored barcode (no valid department prefix): {}", barcode);
                                        }
                                    }
                                    
                                    // Reset burst detection
                                    burst_detected = false;
                                    
                                    // Check if session should continue
                                    if scanner.is_scanning {
                                        scanner.last_input = now;
                                    }
                                }
                            }
                        }
                        return;
                    }

                    // Convert key to character and add to buffer
                    if let Some(c) = key_to_char(key) {
                        let time_since_last = now.duration_since(last_char_time);
                        
                        // Detect burst input (typical of barcode scanners)
                        // Only detect burst if we have enough characters and they're coming fast
                        if time_since_last.as_millis() < 100 && char_buffer.len() > 2 {
                            burst_detected = true;
                        }
                        
                        char_buffer.push(c);
                        last_char_time = now;
                        
                        // Reset burst detection if too much time passes between characters
                        if time_since_last.as_millis() > 500 {
                            burst_detected = false;
                        }
                    }                    // Check for session timeout
                    if let Ok(mut scanner) = scanner_clone.lock() {
                        if scanner.is_scanning && now.duration_since(scanner.last_input).as_millis() > scanner.session_timeout_ms as u128 {
                            scanner.is_scanning = false;
                            let _ = app_clone.emit("scan-session-ended", ());
                            println!("Scan session ended due to timeout");
                        }
                    }
                    
                    // Clean old character buffer if no recent activity
                    if !char_buffer.is_empty() && now.duration_since(last_char_time).as_millis() > 1000 {
                        char_buffer.clear();
                        burst_detected = false;
                    }
                }
            }) {
                eprintln!("Error listening to keyboard input: {:?}", error);
            }
        });

        Ok(())
    }

    pub fn start_manual_session(&mut self) {
        self.is_scanning = true;
        self.last_input = Instant::now();
        println!("Manual scan session started");
    }

    pub fn stop_session(&mut self) {
        self.is_scanning = false;
        println!("Scan session stopped");
    }
}

fn key_to_char(key: Key) -> Option<char> {
    match key {
        Key::KeyA => Some('a'),
        Key::KeyB => Some('b'),
        Key::KeyC => Some('c'),
        Key::KeyD => Some('d'),
        Key::KeyE => Some('e'),
        Key::KeyF => Some('f'),
        Key::KeyG => Some('g'),
        Key::KeyH => Some('h'),
        Key::KeyI => Some('i'),
        Key::KeyJ => Some('j'),
        Key::KeyK => Some('k'),
        Key::KeyL => Some('l'),
        Key::KeyM => Some('m'),
        Key::KeyN => Some('n'),
        Key::KeyO => Some('o'),
        Key::KeyP => Some('p'),
        Key::KeyQ => Some('q'),
        Key::KeyR => Some('r'),
        Key::KeyS => Some('s'),
        Key::KeyT => Some('t'),
        Key::KeyU => Some('u'),
        Key::KeyV => Some('v'),
        Key::KeyW => Some('w'),
        Key::KeyX => Some('x'),
        Key::KeyY => Some('y'),
        Key::KeyZ => Some('z'),
        Key::Num0 => Some('0'),
        Key::Num1 => Some('1'),
        Key::Num2 => Some('2'),
        Key::Num3 => Some('3'),
        Key::Num4 => Some('4'),
        Key::Num5 => Some('5'),
        Key::Num6 => Some('6'),
        Key::Num7 => Some('7'),
        Key::Num8 => Some('8'),
        Key::Num9 => Some('9'),
        Key::Space => Some(' '),
        Key::Minus => Some('-'),
        Key::Equal => Some('='),
        Key::LeftBracket => Some('['),
        Key::RightBracket => Some(']'),
        Key::SemiColon => Some(';'),
        Key::Quote => Some('\''),
        Key::Comma => Some(','),
        Key::Dot => Some('.'),
        Key::Slash => Some('/'),
        Key::BackSlash => Some('\\'),
        _ => None,
    }
}
