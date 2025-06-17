"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeScanner = void 0;
class BarcodeScanner {
    categoryManager;
    triggerBarcodes;
    constructor(categoryManager) {
        this.categoryManager = categoryManager;
        this.triggerBarcodes = ['SCAN_START', 'ACTIVATE', 'TRIGGER', 'START_SCAN'];
    }
    async processBarcode(barcode, dbManager) {
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
    async determineScanType(barcode, dbManager) {
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
            }
            catch (error) {
                console.error('Error checking item status:', error);
            }
        }
        // Fallback: default to checkout
        return 'checkout';
    }
    updateTriggerBarcodes(triggers) {
        this.triggerBarcodes = triggers.map(t => t.toUpperCase());
    }
    getTriggerBarcodes() {
        return [...this.triggerBarcodes];
    }
}
exports.BarcodeScanner = BarcodeScanner;
