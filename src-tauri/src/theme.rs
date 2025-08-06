#[cfg(windows)]
use winapi::um::winreg::{RegOpenKeyExW, RegQueryValueExW, HKEY_CURRENT_USER};
#[cfg(windows)]
use winapi::um::winnt::{KEY_READ, REG_DWORD};
#[cfg(windows)]
use std::ptr;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SystemTheme {
    Light,
    Dark,
}

impl SystemTheme {
    /// Detects the current system theme on Windows by checking the registry
    pub fn detect() -> Self {
        #[cfg(windows)]
        {
            detect_windows_theme().unwrap_or(SystemTheme::Light)
        }
        #[cfg(not(windows))]
        {
            // Default to light theme on non-Windows platforms
            SystemTheme::Light
        }
    }

    /// Returns the appropriate tray icon filename for this theme
    pub fn tray_icon_filename(&self) -> &'static str {
        match self {
            SystemTheme::Light => "tray-icon-black.png",
            SystemTheme::Dark => "tray-icon-white.png",
        }
    }
}

#[cfg(windows)]
fn detect_windows_theme() -> Option<SystemTheme> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    
    unsafe {
        let subkey = OsStr::new("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let value_name = OsStr::new("AppsUseLightTheme")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let mut hkey = ptr::null_mut();
        let result = RegOpenKeyExW(
            HKEY_CURRENT_USER,
            subkey.as_ptr(),
            0,
            KEY_READ,
            &mut hkey,
        );
        
        if result != 0 {
            return None;
        }
        
        let mut value: u32 = 0;
        let mut value_size = std::mem::size_of::<u32>() as u32;
        let mut value_type = REG_DWORD;
        
        let result = RegQueryValueExW(
            hkey,
            value_name.as_ptr(),
            ptr::null_mut(),
            &mut value_type,
            &mut value as *mut u32 as *mut u8,
            &mut value_size,
        );
        
        winapi::um::winreg::RegCloseKey(hkey);
        
        if result == 0 && value_type == REG_DWORD {
            // AppsUseLightTheme: 1 = light theme, 0 = dark theme
            if value == 0 {
                Some(SystemTheme::Dark)
            } else {
                Some(SystemTheme::Light)
            }
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_detection() {
        let theme = SystemTheme::detect();
        println!("Detected theme: {:?}", theme);
        
        match theme {
            SystemTheme::Light => println!("Should use black icon: {}", theme.tray_icon_filename()),
            SystemTheme::Dark => println!("Should use white icon: {}", theme.tray_icon_filename()),
        }
    }
}
