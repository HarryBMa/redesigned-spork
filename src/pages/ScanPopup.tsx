import React, { useState, useEffect, useRef } from 'react';

const ScanPopup: React.FC = () => {
  const [itemId, setItemId] = useState('');
  const [lastScan, setLastScan] = useState<{ id: string; status: 'IN' | 'OUT' } | null>(null);
  const [items, setItems] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Handle scan submission
   */
  const handleScan = () => {
    const trimmedId = itemId.trim();
    if (!trimmedId) return;

    // Check if item is already in the set
    const isItemIn = items.has(trimmedId);
    
    if (isItemIn) {
      // Remove item (OUT)
      const newItems = new Set(items);
      newItems.delete(trimmedId);
      setItems(newItems);
      setLastScan({ id: trimmedId, status: 'OUT' });
    } else {
      // Add item (IN)
      const newItems = new Set(items);
      newItems.add(trimmedId);
      setItems(newItems);
      setLastScan({ id: trimmedId, status: 'IN' });
    }

    // Clear input and refocus for next scan
    setItemId('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Handle input change with automatic submission detection
   * Barcode scanners typically input data very quickly, so we'll use a timer
   * to detect when input has stopped and automatically submit
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setItemId(newValue);

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Set a new timeout to auto-submit after a short delay
    // This allows for barcode scanner input which is typically very fast
    if (newValue.trim()) {
      scanTimeoutRef.current = setTimeout(() => {
        handleScan();
      }, 100); // 100ms delay - fast enough for scanners, slow enough for manual typing
    }
  };

  /**
   * Handle Enter key press for manual entry
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear any pending auto-scan timeout and submit immediately
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      handleScan();
    }
  };

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#f5f5dc',
      color: '#333',
      minHeight: '100vh',
      padding: '20px',
      margin: 0
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        
        {/* Input Section */}
        <div style={{
          backgroundColor: '#faf8f5',
          border: '3px solid #000',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={itemId}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="SCAN ITEM ID..."
            autoFocus
            style={{
              width: '100%',
              padding: '15px 20px',
              fontSize: '18px',
              fontFamily: '"Courier New", monospace',
              border: '3px solid #000',
              backgroundColor: '#faf8f5',
              color: '#000',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center'
            }}
          />
        </div>

        {/* Status Display */}
        {lastScan && (
          <div style={{
            backgroundColor: '#faf8f5',
            border: '3px solid #000',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              {lastScan.id}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              padding: '10px 20px',
              border: '2px solid #000',
              backgroundColor: lastScan.status === 'IN' ? '#4ade80' : '#fbbf24',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '3px'
            }}>
              {lastScan.status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPopup;
