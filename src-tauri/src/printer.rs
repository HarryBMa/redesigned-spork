use std::net::TcpStream;
use std::io::Write;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterSettings {
    pub ip_address: String,
    pub port: u16,
    pub label_width: u16,
    pub label_height: u16,
    pub print_density: u8,  // 0-30, default 8
    pub print_speed: u8,    // 1-14, default 6
}

impl Default for PrinterSettings {
    fn default() -> Self {
        Self {
            ip_address: "192.168.1.100".to_string(), // Default IP, should be configured
            port: 9100, // Standard ZPL port
            label_width: 203, // 2 inches at 203 DPI
            label_height: 152, // 1.5 inches at 203 DPI
            print_density: 8,
            print_speed: 6,
        }
    }
}

pub struct ZebraPrinter {
    settings: PrinterSettings,
}

impl ZebraPrinter {
    pub fn new(settings: PrinterSettings) -> Self {
        Self { settings }
    }

    /// Generate ZPL code for a barcode label
    pub fn generate_zpl(&self, barcode: &str, department: Option<&str>) -> String {
        let dept_text = department.unwrap_or("Surgical Inventory");
        let date = chrono::Local::now().format("%Y-%m-%d").to_string();
        
        format!(
            "^XA\n\
             ^MMT\n\
             ^PW{}\n\
             ^LL{}\n\
             ^LS0\n\
             ^FT20,40^A0N,25,25^FD{}^FS\n\
             ^FT20,80^BCN,60,Y,N,N\n\
             ^FD{}^FS\n\
             ^FT20,160^A0N,20,20^FD{}^FS\n\
             ^FT20,185^A0N,15,15^FD{}^FS\n\
             ^XZ\n",
            self.settings.label_width,
            self.settings.label_height,
            dept_text,
            barcode,
            barcode,
            date
        )
    }

    /// Print barcodes directly to Zebra printer via network
    pub fn print_barcodes(&self, barcodes: &[String], department: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
        let address = format!("{}:{}", self.settings.ip_address, self.settings.port);
        let mut stream = TcpStream::connect(&address)
            .map_err(|e| format!("Failed to connect to printer at {}: {}", address, e))?;

        // Send printer configuration
        let config_zpl = format!(
            "^XA\n\
             ^PQ{},0,1,Y\n\
             ^MD{}\n\
             ^PR{}\n\
             ^XZ\n",
            barcodes.len(),
            self.settings.print_density,
            self.settings.print_speed
        );
        
        stream.write_all(config_zpl.as_bytes())?;

        // Send each barcode label
        for barcode in barcodes {
            let zpl = self.generate_zpl(barcode, department);
            stream.write_all(zpl.as_bytes())?;
        }

        stream.flush()?;
        Ok(())
    }

    /// Test printer connection
    pub fn test_connection(&self) -> Result<(), Box<dyn std::error::Error>> {
        let address = format!("{}:{}", self.settings.ip_address, self.settings.port);
        let mut stream = TcpStream::connect(&address)
            .map_err(|e| format!("Failed to connect to printer at {}: {}", address, e))?;

        // Send a simple status request
        stream.write_all(b"^XA^HH^XZ")?;
        stream.flush()?;
        Ok(())
    }

    /// Print a test label
    pub fn print_test_label(&self) -> Result<(), Box<dyn std::error::Error>> {
        let test_zpl = format!(
            "^XA\n\
             ^PW{}\n\
             ^LL{}\n\
             ^FT20,40^A0N,25,25^FDTest Label^FS\n\
             ^FT20,80^BCN,60,Y,N,N\n\
             ^FDTEST123^FS\n\
             ^FT20,160^A0N,20,20^FDTEST123^FS\n\
             ^FT20,185^A0N,15,15^FD{}^FS\n\
             ^XZ\n",
            self.settings.label_width,
            self.settings.label_height,
            chrono::Local::now().format("%Y-%m-%d %H:%M")
        );

        let address = format!("{}:{}", self.settings.ip_address, self.settings.port);
        let mut stream = TcpStream::connect(&address)
            .map_err(|e| format!("Failed to connect to printer at {}: {}", address, e))?;

        stream.write_all(test_zpl.as_bytes())?;
        stream.flush()?;
        Ok(())
    }

    /// Get printer status (simplified)
    pub fn get_status(&self) -> Result<String, Box<dyn std::error::Error>> {
        let address = format!("{}:{}", self.settings.ip_address, self.settings.port);
        let mut stream = TcpStream::connect(&address)
            .map_err(|e| format!("Failed to connect to printer at {}: {}", address, e))?;

        // Request printer status
        stream.write_all(b"~HS")?;
        stream.flush()?;

        // In a real implementation, you'd read the response
        // For now, just return connection success
        Ok("Connected".to_string())
    }
}

/// Helper function to discover Zebra printers on the network
pub fn discover_zebra_printers() -> Vec<String> {
    // This is a simplified version - in production you might want to implement
    // a proper network discovery using UDP broadcast or SNMP
    vec![
        "192.168.1.100".to_string(),
        "192.168.1.101".to_string(),
        "192.168.1.102".to_string(),
    ]
}
