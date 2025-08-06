use std::fs;
use harrys_lilla_lager_lib::database::Database;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Read the items from the file
    let content = fs::read_to_string("../items_import.txt")?;
    
    let db = Database::new()?;
    let mut items = Vec::new();
    
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        
        // Split by space (first word is barcode, rest is name)
        let parts: Vec<&str> = line.splitn(2, ' ').collect();
        if parts.len() == 2 {
            let barcode = parts[0].to_string();
            let name = parts[1].to_string();
            items.push((barcode, name));
        }
    }
    
    println!("Found {} items to import", items.len());
    
    // Import items
    let imported_count = db.import_items_from_list(&items)?;
    
    println!("Successfully imported {} items!", imported_count);
    
    // Test: Get a few items to verify
    println!("\nVerifying import - checking a few items:");
    let test_barcodes = ["KÄKX001", "ÖNHX005", "ÖNHX099"];
    
    for barcode in &test_barcodes {
        if let Some(name) = db.get_item_name(barcode)? {
            println!("  {}: {}", barcode, name);
        } else {
            println!("  {}: Not found", barcode);
        }
    }
    
    Ok(())
}
