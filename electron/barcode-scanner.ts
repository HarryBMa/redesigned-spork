import { CategoryManager } from './category-manager';

export interface ScanResult {
  action: 'trigger' | 'scan' | 'unknown';
  barcode?: string;
  category?: string;
  scanType?: 'checkout' | 'checkin';
  metadata?: any;
}

export class BarcodeScanner {
  private categoryManager: CategoryManager;
  private triggerBarcodes: string[];
  
  constructor(categoryManager: CategoryManager) {
    this.categoryManager = categoryManager;
    this.triggerBarcodes = ['SCAN_START', 'ACTIVATE', 'TRIGGER', 'START_SCAN'];
  }
  async processBarcode(barcode: string, dbManager?: any): Promise<ScanResult> {
    // Clean the barcode input
    const cleanBarcode = barcode.trim().toUpperCase();

    // Check if it's a trigger barcode
    if (this.triggerBarcodes.includes(cleanBarcode)) {
      return {
        action: 'trigger'
      };
    }

    // Determine category from barcode prefix
    const category = this.categoryManager.getCategoryFromBarcode(cleanBarcode);
    
    if (!category) {
      return {
        action: 'unknown'
      };
    }

    // Automatically determine scan type based on current item status
    const scanType = await this.determineScanType(cleanBarcode, dbManager);

    return {
      action: 'scan',
      barcode: cleanBarcode,
      category,
      scanType,
      metadata: {
        timestamp: new Date().toISOString(),
        originalBarcode: barcode
      }
    };
  }

  private async determineScanType(barcode: string, dbManager?: any): Promise<'checkout' | 'checkin'> {
    // Check current status of the item in database
    if (dbManager) {
      try {
        const lastScan = await dbManager.getLastScanForBarcode(barcode);
        
        if (!lastScan) {
          // No previous scans = first time = checkout
          return 'checkout';
        }
        
        // Toggle based on last action:
        // Last was checkout → now checkin
        // Last was checkin → now checkout
        return lastScan.action === 'checkout' ? 'checkin' : 'checkout';
        
      } catch (error) {
        console.error('Error checking item status:', error);
      }
    }
    
    // Fallback: default to checkout
    return 'checkout';
  }

  updateTriggerBarcodes(triggers: string[]) {
    this.triggerBarcodes = triggers.map(t => t.toUpperCase());
  }

  getTriggerBarcodes(): string[] {
    return [...this.triggerBarcodes];
  }
}
