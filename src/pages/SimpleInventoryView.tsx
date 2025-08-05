import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Scan, Settings, Download } from 'lucide-react';
import WindowFrame from '../components/layout/WindowFrame';
import ScanPanel from '../components/features/ScanPanel';
import { useModal } from '../components/ui/custom-modal';

interface ScanLog {
  id: number;
  timestamp: string;
  barcode: string;
  action: string;
  department?: string;
}

interface SimpleInventoryViewProps {
  onOpenSettings: () => void;
}

const SimpleInventoryView: React.FC<SimpleInventoryViewProps> = ({ onOpenSettings }) => {
  const { showAlert } = useModal();
  const [checkedOutItems, setCheckedOutItems] = useState<ScanLog[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadCheckedOutItems();
    
    const setupListeners = async () => {
      // Listen for barcode scanned events
      await listen('barcode-scanned', (event: any) => {
        console.log('Barcode scanned:', event.payload);
        loadCheckedOutItems(); // Refresh data after scan
      });

      // Listen for manual scan events from the popup
      await listen('manual-scan-complete', (event: any) => {
        console.log('Manual scan complete:', event.payload);
        loadCheckedOutItems(); // Refresh data after manual scan
      });
    };

    setupListeners();

    // Set up periodic refresh to catch any missed updates
    const interval = setInterval(() => {
      loadCheckedOutItems();
    }, 5000); // Refresh every 5 seconds
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadCheckedOutItems = async () => {
    try {
      const items = await invoke<ScanLog[]>('get_checked_out_items');
      setCheckedOutItems(items);
    } catch (error) {
      console.error('Error loading checked out items:', error);
    }
  };

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) return;
    
    try {
      await invoke('manual_scan_barcode', { barcode: manualBarcode });
      setManualBarcode('');
      loadCheckedOutItems();
    } catch (error) {
      console.error('Error scanning barcode:', error);
    }
  };

  const handleScanButtonClick = async () => {
    try {
      await invoke('show_quick_scan_popup');
    } catch (error) {
      console.error('Error showing quick scan popup:', error);
    }
  };

  const handleExportItems = async () => {
    try {
      const filePath = await invoke<string>('quick_export_checked_out');
      console.log('Export successful:', filePath);
      
      await showAlert('Export klar', `Export framgångsrik! Fil sparad till:\n${filePath}`);
    } catch (error) {
      console.error('Error exporting items:', error);
      await showAlert('Export misslyckades', 'Export misslyckades. Försök igen.');
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m sedan`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h sedan`;
    const days = Math.floor(hours / 24);
    return `${days}d sedan`;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-indigo-900/60 backdrop-blur-xl border border-white/20 overflow-hidden shadow-2xl">

      {/* Custom Window Frame */}
      <WindowFrame title="Harry's Lilla Lager" />
      
      {/* Main Content */}
      <div className="flex flex-col h-full p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
          </div>
          
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <button
              onClick={handleExportItems}
              className="p-3 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all duration-300"
              title="Exportera utcheckade artiklar"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-3 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all duration-300"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scan Panel */}
        <ScanPanel
          onScan={handleScanButtonClick}
          manualBarcode={manualBarcode}
          onManualBarcodeChange={setManualBarcode}
          onManualScan={handleManualScan}
        />

        {/* Checked Out Items List */}
        <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl shadow-inner border border-white/10 p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold text-white mb-4">
            Utcheckade artiklar ({checkedOutItems.length})
          </h2>
          
          {checkedOutItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4">
                <Scan className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 text-lg mb-2">Inga artiklar är för närvarande utcheckade</p>
              <p className="text-white/40 text-sm">Skanna en artikel för att checka ut den</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedOutItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-4 shadow-inner border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-white text-lg">
                        {item.barcode}
                      </div>
                      {item.department && (
                        <div className="text-indigo-400 text-sm mt-1">
                          {item.department}
                        </div>
                      )}
                    </div>
                    <div className="text-white/60 text-sm text-right">
                      <div>{formatTimeAgo(item.timestamp)}</div>
                      <div className="text-xs text-white/40">
                        {formatDateTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleInventoryView;
