import { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  X, 
  CheckCircle, 
  XCircle, 
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Clock
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  message: string;
  trigger?: boolean;
  scan?: {
    barcode: string;
    category: string;
    scanType: 'checkout' | 'checkin';
  };
}

export default function ScanWindow() {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Auto-submit when barcode is scanned (when Enter is pressed after scan)
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcode.trim()) {
        handleScan(new Event('submit') as any);
      }
    };

    document.addEventListener('keydown', handleEnterKey);

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          window.electronAPI?.closeScanWindow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('keydown', handleEnterKey);
    };
  }, [barcode]);

  // Auto-submit when barcode value changes (for immediate processing)
  useEffect(() => {
    if (barcode.length >= 4 && !scanning) { // Minimum barcode length
      const timer = setTimeout(() => {
        handleScan(new Event('submit') as any);
      }, 500); // Small delay to ensure complete scan

      return () => clearTimeout(timer);
    }
  }, [barcode, scanning]);

  const resetTimer = () => {
    setTimeRemaining(10);
  };
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setScanning(true);
    resetTimer();

    try {
      const result = await window.electronAPI.processBarcode(barcode.trim());
      setLastResult(result);
      
      // Automatically process and clear for next scan - no user interaction needed
      if (result.scan) {
        // Show brief confirmation then clear
        setTimeout(() => {
          setBarcode('');
          setLastResult(null);
        }, 2000); // Show result for 2 seconds then clear
      } else {
        setBarcode(''); // Clear immediately for trigger barcodes
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: 'Failed to process barcode'
      });
      setTimeout(() => {
        setBarcode('');
        setLastResult(null);
      }, 2000);
    } finally {
      setScanning(false);
      // Always refocus input for continuous scanning
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }      }, 100);
    }
  };

  const closeScanWindow = () => {
    window.electronAPI?.closeScanWindow();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Harrys lilla Lager - Aktiv</h1>
              <p className="text-sm text-gray-600">Ready for barcode input</p>
            </div>
          </div>
          <button
            onClick={closeScanWindow}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Auto-close in:</span>
            </div>
            <div className={`text-lg font-bold ${
              timeRemaining <= 3 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeRemaining}s
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeRemaining <= 3 ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Scan Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                {scanning ? 'Processing...' : 'Scan Barcode (Auto-Process)'}
              </label>
              <input
                ref={inputRef}
                type="text"
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={() => resetTimer()}
                placeholder="Ready for barcode scan..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono text-center"
                disabled={scanning}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                No buttons needed - just scan and it's processed automatically!
              </p>
            </div>
          </form>
        </div>

        {/* Last Result - Enhanced for auto-processing */}
        {lastResult && (
          <div className={`p-6 rounded-xl ${
            lastResult.success 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="text-center">
              <div className={`inline-flex p-3 rounded-full mb-4 ${
                lastResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {lastResult.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              
              <h3 className={`text-lg font-bold mb-2 ${
                lastResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {lastResult.success ? '✅ Success!' : '❌ Error'}
              </h3>
              
              <p className={`font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.message}
              </p>
              
              {lastResult.scan && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Item Details:</div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{lastResult.scan.category}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      {lastResult.scan.scanType === 'checkout' ? (
                        <>
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                          <span className="text-red-700 font-bold">CHECKED OUT</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          <span className="text-green-700 font-bold">CHECKED IN</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 font-mono mt-2">
                      {lastResult.scan.barcode}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-3">
                Ready for next scan...
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Använd en trådlös streckkodsläsare eller skriv manuellt</p>
          <p>Window will close automatically after {timeRemaining} seconds of inactivity</p>
        </div>
      </div>
    </div>
  );
}
