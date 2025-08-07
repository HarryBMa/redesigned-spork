import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Article } from '../types';

export const useScannerLogic = () => {
  // State for input and scanner detection
  const [itemId, setItemId] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Refs for scanner detection
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef<number>(0);
  const inputLengthRef = useRef<number>(0);
  const scannerDetectedRef = useRef<boolean>(false);

  /**
   * Handles form submission when user enters an item ID
   * Integrates with Tauri backend for scanning
   */
  const handleScan = async (showToast: (message: string, type: 'success' | 'warning' | 'error') => void, loadData: () => void) => {
    // Trim whitespace and validate input
    const trimmedId = itemId.trim();
    if (!trimmedId) {
      showToast('Please enter a valid item ID', 'error');
      return;
    }

    try {
      // Use Tauri backend for scanning if available
      const result = await invoke<{
        barcode: string;
        action: string;
        department?: string;
      }>('manual_scan_barcode', { barcode: trimmedId });
      
      // Show success message with action taken
      const actionText = result.action === 'checked_out' ? 'CHECKED OUT' : 'CHECKED IN';
      const departmentText = result.department ? ` (${result.department})` : '';
      showToast(`${result.barcode} ${actionText}${departmentText}`, 'success');
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error scanning barcode:', error);
      
      // Fallback to local logic if Tauri backend not available
      const existingItemIndex = articles.findIndex(article => article.id === trimmedId);
      
      if (existingItemIndex !== -1) {
        // Item exists - remove it from the list
        setArticles(prevArticles => 
          prevArticles.filter(article => article.id !== trimmedId)
        );
        
        showToast(`Item removed: ${trimmedId}`, 'warning');
      } else {
        // Item doesn't exist - add it to the list
        const newArticle: Article = {
          id: trimmedId,
          timestamp: new Date()
        };
        
        setArticles(prevArticles => [newArticle, ...prevArticles]);
        showToast(`Item added: ${trimmedId}`, 'success');
      }
    }
    
    // Clear the input field after submission and refocus
    setItemId('');
    
    // Reset detection refs
    scannerDetectedRef.current = false;
    lastInputTimeRef.current = 0;
    inputLengthRef.current = 0;
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Handles form submission with a specific value (used for scanner auto-submit)
   * Integrates with Tauri backend for scanning
   */
  const handleScanWithValue = async (trimmedId: string, showToast: (message: string, type: 'success' | 'warning' | 'error') => void, loadData: () => void) => {
    if (!trimmedId) {
      showToast('Please enter a valid item ID', 'error');
      return;
    }

    try {
      // Use Tauri backend for scanning if available
      await invoke('manual_scan_barcode', { barcode: trimmedId });
      showToast(`Item scanned: ${trimmedId}`, 'success');
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error scanning barcode:', error);
      
      // Fallback to local logic if Tauri backend not available
      const existingItemIndex = articles.findIndex(article => article.id === trimmedId);
      
      if (existingItemIndex !== -1) {
        // Item exists - remove it from the list
        setArticles(prevArticles => 
          prevArticles.filter(article => article.id !== trimmedId)
        );
        
        showToast(`Item removed: ${trimmedId}`, 'warning');
      } else {
        // Item doesn't exist - add it to the list
        const newArticle: Article = {
          id: trimmedId,
          timestamp: new Date()
        };
        
        setArticles(prevArticles => [newArticle, ...prevArticles]);
        showToast(`Item added: ${trimmedId}`, 'success');
      }
    }
    
    // Clear the input field after submission and refocus
    setItemId('');
    
    // Reset detection refs
    scannerDetectedRef.current = false;
    lastInputTimeRef.current = 0;
    inputLengthRef.current = 0;
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Handle input change with automatic submission detection
   * Barcode scanners typically input data very quickly, so we'll use a timer
   * to detect when input has stopped and automatically submit
   * Manual input will only submit when Enter is pressed
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, showToast: (message: string, type: 'success' | 'warning' | 'error') => void, loadData: () => void) => {
    const newValue = e.target.value;
    const currentTime = Date.now();
    const timeSinceLastInput = currentTime - lastInputTimeRef.current;
    
    setItemId(newValue);
    
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Detect if this looks like barcode scanner input:
    // - Very fast typing (less than 30ms between characters)
    // - OR significant length increase (pasted/scanned content)
    const isFastInput = timeSinceLastInput < 30 && newValue.length > inputLengthRef.current;
    const isLengthJump = newValue.length - inputLengthRef.current > 5;
    const isProbablyScanner = isFastInput || isLengthJump;
    
    // Mark if scanner input is detected
    if (isProbablyScanner) {
      scannerDetectedRef.current = true;
    }
    
    // Update refs
    lastInputTimeRef.current = currentTime;
    inputLengthRef.current = newValue.length;

    // Set timeout to submit when input stops (for both scanner and potential scanner input)
    if (newValue.trim()) {
      scanTimeoutRef.current = setTimeout(() => {
        // Only auto-submit if scanner was detected during this input session
        if (scannerDetectedRef.current) {
          // Get the current value directly from the input field, not from state
          const currentInputValue = inputRef.current?.value || '';
          if (currentInputValue.trim()) {
            handleScanWithValue(currentInputValue.trim(), showToast, loadData);
          }
          scannerDetectedRef.current = false; // Reset for next input
        }
      }, 150); // Increased delay to ensure all characters are captured
    } else {
      // Reset scanner detection when input is cleared
      scannerDetectedRef.current = false;
    }
  };

  /**
   * Handle Enter key press for manual entry
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, showToast: (message: string, type: 'success' | 'warning' | 'error') => void, loadData: () => void) => {
    if (e.key === 'Enter') {
      // Clear any pending auto-scan timeout and submit immediately
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scannerDetectedRef.current = false; // Reset scanner detection
      handleScan(showToast, loadData);
    }
  };

  return {
    itemId,
    setItemId,
    articles,
    setArticles,
    inputRef,
    handleScan,
    handleScanWithValue,
    handleInputChange,
    handleKeyDown
  };
};
