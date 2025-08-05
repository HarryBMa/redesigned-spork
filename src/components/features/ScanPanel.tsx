import React, { useState, useEffect, useRef } from 'react';
import logoSvg from '../../assets/logo.svg';

interface ScanPanelProps {
  onScan: () => void;
  manualBarcode: string;
  onManualBarcodeChange: (value: string) => void;
  onManualScan: () => void;
}

const ScanPanel: React.FC<ScanPanelProps> = ({
  onScan,
  manualBarcode,
  onManualBarcodeChange,
  onManualScan
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    if (isScanning) {
      inactivityTimer.current = setTimeout(() => {
        setIsScanning(false);
        setScanCount(0);
      }, 3000); // 3 seconds of inactivity
    }
  };

  // Handle scan session toggle
  const handleScanToggle = () => {
    if (isScanning) {
      // Stop scanning session
      setIsScanning(false);
      setScanCount(0);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    } else {
      // Start scanning session
      setIsScanning(true);
      setScanCount(0);
      resetInactivityTimer();
    }
  };

  // Enhanced manual scan that works with session
  const handleManualScan = () => {
    if (isScanning) {
      // During scanning session, automatically add items sequentially
      setScanCount(prev => prev + 1);
      onScan(); // Call the original scan function to add to database
      resetInactivityTimer(); // Reset the inactivity timer
    } else {
      onManualScan();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  // Update timer when scanning state changes
  useEffect(() => {
    if (isScanning) {
      resetInactivityTimer();
    } else {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    }
  }, [isScanning]);
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
      <div className="flex flex-col items-center space-y-6">
        
        {/* Scan Status Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 shadow-inner border border-white/10 hover:bg-white/10 transition-all duration-300 w-full max-w-sm text-center">
          <h3 className="text-white font-semibold text-lg mb-2">Skanning Status</h3>
          <p className="text-slate-300 text-sm">
            {isScanning 
              ? `Aktiv session - ${scanCount} objekt skannade` 
              : "Väntar på inmatning..."
            }
          </p>
          {isScanning && (
            <div className="mt-2">
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">AKTIV</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Skanna eller ange objekt sekventiellt
              </p>
            </div>
          )}
        </div>

        {/* Main Scan Button */}
        <button 
          onClick={handleScanToggle}
          className={`w-24 h-24 rounded-full ${
            isScanning 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
              : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30'
          } text-white text-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
            isScanning ? 'animate-pulse' : ''
          }`}
        >
          {isScanning ? (
            <span className="text-xl font-bold">STOPP</span>
          ) : (
            <img 
              src={logoSvg} 
              alt="Harry's Lilla Lager Logo" 
              className="w-18 h-18 filter invert"
            />
          )}
        </button>

        {/* Manual Input */}
        <div className="flex space-x-3 w-full max-w-md">
          <input
            placeholder={isScanning ? "Skanna eller ange streckkod..." : "Ange streckkod manuellt..."}
            value={manualBarcode}
            onChange={(e) => onManualBarcodeChange(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
            onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
          />
          <button 
            onClick={handleManualScan} 
            className={`px-6 py-3 ${
              isScanning 
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30'
            } text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            {isScanning ? 'Lägg till' : 'Skanna/Lägg till'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanPanel;
