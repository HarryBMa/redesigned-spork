#!/usr/bin/env python3
"""
Quick script to test the SQLite database and verify item management functionality
"""
import sqlite3
import os

def test_database():
    db_path = r"c:\Users\Harry\Documents\GitHub\redesigned-spork\portable-build\data\inventory.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    print(f"✅ Database found at {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📋 Tables in database: {[table[0] for table in tables]}")
        
        # Check items table structure
        cursor.execute("PRAGMA table_info(items)")
        item_columns = cursor.fetchall()
        print(f"🔧 Items table structure: {[(col[1], col[2]) for col in item_columns]}")
        
        # Count items
        cursor.execute("SELECT COUNT(*) FROM items")
        item_count = cursor.fetchone()[0]
        print(f"📦 Number of items in database: {item_count}")
        
        # Show first 10 items
        cursor.execute("SELECT barcode, name FROM items LIMIT 10")
        items = cursor.fetchall()
        print("🔍 Sample items:")
        for barcode, name in items:
            print(f"  - {barcode}: {name}")
        
        # Check logs table
        cursor.execute("SELECT COUNT(*) FROM logs")
        log_count = cursor.fetchone()[0]
        print(f"📊 Number of logs in database: {log_count}")
        
        # Check settings
        cursor.execute("SELECT key, value FROM settings")
        settings = cursor.fetchall()
        print(f"⚙️ Settings: {dict(settings)}")
        
        # Check department mappings
        cursor.execute("SELECT prefix, department FROM department_mappings")
        dept_mappings = cursor.fetchall()
        print(f"🏥 Department mappings: {dict(dept_mappings)}")
        
        conn.close()
        print("✅ Database test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")

if __name__ == "__main__":
    test_database()
