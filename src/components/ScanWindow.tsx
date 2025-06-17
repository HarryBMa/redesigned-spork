import { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  X, 
  XCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft
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
      document.removeEventListener('keydown', handleEnterKey);
      clearInterval(timer);
    };
  }, [barcode]);

  // Reset timer when barcode changes
  useEffect(() => {
    setTimeRemaining(10);
  }, [barcode]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || scanning) return;

    setScanning(true);
    try {
      const result = await window.electronAPI.processBarcode(barcode.trim());
      setLastResult(result);

      // Show result for 3 seconds then close window
      if (result.success && !result.trigger) {
        setTimeout(() => {
          window.electronAPI?.closeScanWindow();
        }, 3000);
      }
      
      setBarcode('');
    } catch (error) {
      console.error('Scan error:', error);
      setLastResult({
        success: false,
        message: 'Fel vid skanning. Försök igen.'
      });
    } finally {
      setScanning(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const closeWindow = () => {
    window.electronAPI?.closeScanWindow();
  };

  const getStatusColor = (result: ScanResult) => {
    if (!result.success) return 'text-red-600 bg-red-50 border-red-200';
    if (result.trigger) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (result.scan?.scanType === 'checkout') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = (result: ScanResult) => {
    if (!result.success) return <XCircle size={20} />;
    if (result.trigger) return <Scan size={20} />;
    if (result.scan?.scanType === 'checkout') return <ArrowUpRight size={20} />;
    return <ArrowDownLeft size={20} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Scan size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Harrys lilla Lager</h1>
                <p className="text-blue-100 text-sm">Scanner aktiv</p>
              </div>
            </div>
            <button
              onClick={closeWindow}
              className="text-white/80 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Timer */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="text-sm">Stängs automatiskt om {timeRemaining}s</span>
            </div>
          </div>

          {/* Scan Form */}
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Scanna streckkod eller skriv manuellt
              </label>
              <input
                id="barcode"
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Streckkod här..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                disabled={scanning}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!barcode.trim() || scanning}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scannar...
                </>
              ) : (
                <>
                  <Scan size={20} />
                  Scanna
                </>
              )}
            </button>
          </form>

          {/* Result Display */}
          {lastResult && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${getStatusColor(lastResult)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(lastResult)}
                <div className="flex-1">
                  <p className="font-semibold">{lastResult.message}</p>
                  {lastResult.scan && (
                    <div className="mt-2 text-sm">
                      <p><span className="font-medium">Streckkod:</span> {lastResult.scan.barcode}</p>
                      <p><span className="font-medium">Kategori:</span> {lastResult.scan.category}</p>
                      <p className="font-bold mt-1">
                        {lastResult.scan.scanType === 'checkout' ? '📤 UTCHECKAD' : '📥 INCHECKAD'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Scanna en trigger-kod först för att aktivera</p>
            <p>Sedan scanna valfri utrustning för automatisk hantering</p>
          </div>
        </div>
      </div>
    </div>
  );
}
