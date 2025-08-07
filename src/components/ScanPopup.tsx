import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Toast } from '../types';

// Simplified popup component for tray scanning
const ScanPopup: React.FC = () => {
  const [itemId, setItemId] = useState<string>('');
  const [lastScanResult, setLastScanResult] = useState<{
    barcode: string;
    action: string;
    department?: string;
    timestamp?: string;
  } | null>(null);
  
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'success',
    show: false
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef<number>(0);
  const inputLengthRef = useRef<number>(0);
  const scannerDetectedRef = useRef<boolean>(false);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Set up event listeners for real-time updates from Tauri backend
    const setupListeners = async () => {
      await listen('barcode-scanned', (event: any) => {
        console.log('Barcode scanned:', event.payload);
        setLastScanResult({
          ...event.payload,
          timestamp: new Date().toLocaleTimeString()
        });
        resetAutoCloseTimer();
      });
    };

    setupListeners();
    resetAutoCloseTimer();

    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  const resetAutoCloseTimer = () => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
    }
    
    // Auto-close after 3 seconds of no interaction
    autoCloseTimeoutRef.current = setTimeout(async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.close();
      } catch (error) {
        console.error('Error closing window:', error);
        // Fallback to window.close() for web
        window.close();
      }
    }, 3000);
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
    resetAutoCloseTimer();
  };

  const handleScan = async () => {
    const trimmedId = itemId.trim().toUpperCase();
    if (!trimmedId) {
      showToast('Please enter a valid item ID', 'error');
      return;
    }

    try {
      const result = await invoke<{
        barcode: string;
        action: string;
        department?: string;
      }>('manual_scan_barcode', { barcode: trimmedId });
      
      setLastScanResult({
        ...result,
        timestamp: new Date().toLocaleTimeString()
      });
      
      const actionText = result.action === 'checked_out' ? 'CHECKED OUT' : 'CHECKED IN';
      const departmentText = result.department ? ` (${result.department})` : '';
      showToast(`${result.barcode} ${actionText}${departmentText}`, 'success');
      
      // Auto-close after successful scan
      setTimeout(async () => {
        try {
          const appWindow = getCurrentWindow();
          await appWindow.close();
        } catch (error) {
          console.error('Error closing window:', error);
          // Fallback to window.close() for web
          window.close();
        }
      }, 1500);
    } catch (error) {
      console.error('Error scanning barcode:', error);
      showToast('Error processing scan. Please try again.', 'error');
    }
    
    setItemId('');
    scannerDetectedRef.current = false;
    lastInputTimeRef.current = 0;
    inputLengthRef.current = 0;
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase(); // Auto-uppercase input
    const currentTime = Date.now();
    const timeSinceLastInput = currentTime - lastInputTimeRef.current;
    
    setItemId(newValue);
    resetAutoCloseTimer(); // Reset timer on user interaction
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    const isFastInput = timeSinceLastInput < 30 && newValue.length > inputLengthRef.current;
    const isLengthJump = newValue.length - inputLengthRef.current > 5;
    const isProbablyScanner = isFastInput || isLengthJump;
    
    if (isProbablyScanner) {
      scannerDetectedRef.current = true;
    }
    
    lastInputTimeRef.current = currentTime;
    inputLengthRef.current = newValue.length;

    if (newValue.trim()) {
      scanTimeoutRef.current = setTimeout(() => {
        if (scannerDetectedRef.current) {
          const currentInputValue = inputRef.current?.value || '';
          if (currentInputValue.trim()) {
            handleScan();
          }
          scannerDetectedRef.current = false;
        }
      }, 150);
    } else {
      scannerDetectedRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    resetAutoCloseTimer(); // Reset timer on key interaction
    
    if (e.key === 'Enter') {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scannerDetectedRef.current = false;
      handleScan();
    }
  };

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#f5f5dc',
      color: '#333',
      minHeight: '100vh',
      padding: '15px',
      margin: 0,
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0,
            color: '#000'
          }}>
            QUICK SCAN
          </h2>
        </div>

        {/* Input Section */}
        <div style={{
          backgroundColor: '#faf8f5',
          border: '3px solid #000',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={itemId}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="SCAN OR TYPE ITEM ID..."
            autoFocus
            style={{
              width: '100%',
              padding: '12px 15px',
              fontSize: '16px',
              fontFamily: '"Courier New", monospace',
              border: '2px solid #000',
              backgroundColor: '#faf8f5',
              color: '#000',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div style={{
            backgroundColor: '#000',
            color: '#faf8f5',
            border: '3px solid #000',
            padding: '15px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              LAST SCAN
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '5px',
              color: lastScanResult.action === 'checked_out' ? '#4ade80' : '#fbbf24'
            }}>
              {lastScanResult.barcode}
            </div>
            <div style={{
              fontSize: '14px',
              textTransform: 'uppercase',
              marginBottom: '3px'
            }}>
              {lastScanResult.action === 'checked_out' ? 'CHECKED OUT' : 'CHECKED IN'}
            </div>
            {lastScanResult.department && (
              <div style={{
                fontSize: '12px',
                color: '#ccc'
              }}>
                {lastScanResult.department}
              </div>
            )}
            {lastScanResult.timestamp && (
              <div style={{
                fontSize: '11px',
                color: '#888',
                marginTop: '5px'
              }}>
                {lastScanResult.timestamp}
              </div>
            )}
          </div>
        )}

        {/* Toast notification */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '10px 15px',
          border: '2px solid #000',
          fontWeight: 'bold',
          fontSize: '12px',
          zIndex: 1000,
          opacity: toast.show ? 1 : 0,
          transform: toast.show ? 'translateX(0)' : 'translateX(100%)',
          transition: 'all 0.3s ease',
          backgroundColor: 
            toast.type === 'success' ? '#4ade80' :
            toast.type === 'warning' ? '#fbbf24' : '#ef4444',
          color: toast.type === 'error' ? '#fff' : '#000'
        }}>
          {toast.message}
        </div>
      </div>
    </div>
  );
};

export default ScanPopup;
