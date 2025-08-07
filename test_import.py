#!/usr/bin/env python3
"""
Test script to import items from items_import.txt file into the database
"""
import sqlite3
import os

def import_items():
    db_path = r"c:\Users\Harry\Documents\GitHub\redesigned-spork\portable-build\data\inventory.db"
    items_file = r"c:\Users\Harry\Documents\GitHub\redesigned-spork\portable-build\items_import.txt"
    
    if not os.path.exists(items_file):
        print(f"❌ Items file not found at {items_file}")
        return
    
    print(f"✅ Items file found at {items_file}")
    
    # Read items from file
    items = []
    with open(items_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            # Split by space (first word is barcode, rest is name)
            parts = line.split(' ', 1)
            if len(parts) == 2:
                barcode = parts[0]
                name = parts[1]
                items.append((barcode, name))
    
    print(f"📦 Found {len(items)} items to import")
    
    # Import into database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Import items
        cursor.executemany("INSERT OR REPLACE INTO items (barcode, name) VALUES (?, ?)", items)
        conn.commit()
        
        # Verify import
        cursor.execute("SELECT COUNT(*) FROM items")
        item_count = cursor.fetchone()[0]
        print(f"✅ Successfully imported! Total items in database: {item_count}")
        
        # Show first 10 items
        cursor.execute("SELECT barcode, name FROM items LIMIT 10")
        sample_items = cursor.fetchall()
        print("🔍 Sample imported items:")
        for barcode, name in sample_items:
            print(f"  - {barcode}: {name}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error importing items: {e}")

if __name__ == "__main__":
    import_items()
