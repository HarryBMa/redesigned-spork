import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Settings, Download, Trash2, Plus, QrCode, X } from 'lucide-react';
import BarcodeGenerator from './components/features/BarcodeGenerator';
import InputSection from './components/InputSection';
import InventoryTable from './components/InventoryTable';
import AdminSettingsModal from './components/AdminSettingsModal';

// Type definitions
interface Article {
  id: string;
  timestamp: Date;
}

interface ScanLog {
  id: number;
  timestamp: string;
  barcode: string;
  action: string;
  department?: string;
}

interface DepartmentMapping {
  prefix: string;
  department: string;
}

const App: React.FC = () => {
  // State to manage the list of registered articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [checkedOutItems, setCheckedOutItems] = useState<ScanLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  
  // State to manage the current input value
  const [itemId, setItemId] = useState<string>('');

  // Settings and admin state
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [departmentMappings, setDepartmentMappings] = useState<DepartmentMapping[]>([]);
  const [newPrefix, setNewPrefix] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  // State for toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    loadData();
    
    // Set up event listeners for real-time updates from Tauri backend
    const setupListeners = async () => {
      await listen('barcode-scanned', (event: any) => {
        console.log('Barcode scanned:', event.payload);
        loadData();
      });

      await listen('manual-scan-complete', (event: any) => {
        console.log('Manual scan complete:', event.payload);
        loadData();
      });
    };

    setupListeners();

    // Set up periodic refresh to catch any missed updates
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const [logs, mappings, checkedOut] = await Promise.all([
        invoke<ScanLog[]>('get_recent_logs', { limit: 100 }),
        invoke<DepartmentMapping[]>('get_department_mappings'),
        invoke<ScanLog[]>('get_checked_out_items'),
      ]);
      
      setRecentLogs(logs);
      setDepartmentMappings(mappings);
      setCheckedOutItems(checkedOut);
      
      // Convert checked out items to local articles format for display
      const convertedArticles = checkedOut.map(item => ({
        id: item.barcode,
        timestamp: new Date(item.timestamp)
      }));
      setArticles(convertedArticles);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to local state if Tauri backend not available
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  /**
   * Handles form submission when user enters an item ID
   * Integrates with Tauri backend for scanning
   */
  const handleScan = async () => {
    // Trim whitespace and validate input
    const trimmedId = itemId.trim();
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Export checked out items
   */
  const handleExport = async () => {
    try {
      const filePath = await invoke<string>('quick_export_checked_out');
      showToast(`Export successful! File saved to: ${filePath}`, 'success');
    } catch (error) {
      console.error('Error exporting items:', error);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  /**
   * Admin login handler
   */
  const handleAdminLogin = async () => {
    if (adminPassword === 'demoHH') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      showToast('Incorrect password. Please try again.', 'error');
      setAdminPassword('');
    }
  };

  /**
   * Add department mapping
   */
  const handleAddDepartmentMapping = async () => {
    if (!newPrefix.trim() || !newDepartment.trim()) return;
    
    try {
      await invoke('set_department_mapping', { 
        prefix: newPrefix.toUpperCase(), 
        department: newDepartment 
      });
      setNewPrefix('');
      setNewDepartment('');
      loadData();
      showToast('Department mapping added successfully', 'success');
    } catch (error) {
      console.error('Error adding department mapping:', error);
      showToast('Failed to add department mapping', 'error');
    }
  };

  /**
   * Clear all logs
   */
  const handleClearLogs = async () => {
    try {
      await invoke('clear_all_logs');
      loadData();
      showToast('All logs cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing logs:', error);
      showToast('Failed to clear logs', 'error');
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

  /**
   * Formats timestamp for display in the table
   */
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#f5f5dc',
      color: '#333',
      minHeight: '100vh',
      padding: '40px 20px',
      margin: 0
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        
        {/* Header with Settings Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <img src="src/assets/logo.svg" alt="Logo" style={{ display:'flex', maxHeight: '50px', border: '2px solid #000', backgroundColor: '#ffffffff' }} />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: 0
          }}>
            HARRY'S LILLA LAGER
          </h1>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                fontFamily: '"Courier New", monospace',
                border: '2px solid #000',
                backgroundColor: '#4ade80',
                color: '#000',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 'bold'
              }}
              title="Export Items"
            >
              <Download style={{ width: '16px', height: '16px' }} />
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                fontFamily: '"Courier New", monospace',
                border: '2px solid #000',
                backgroundColor: '#faf8f5',
                color: '#000',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 'bold'
              }}
              title="Settings"
            >
              <Settings style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
        
        {/* Input Section */}
        <InputSection
          itemId={itemId}
          inputRef={inputRef}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
        />

  {/* Inventory List */}
  <InventoryTable articles={articles} formatTimestamp={formatTimestamp} />
      </div>

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        show={showSettings}
        isAdminUnlocked={isAdminUnlocked}
        adminPassword={adminPassword}
        setShow={setShowSettings}
        setIsAdminUnlocked={setIsAdminUnlocked}
        setAdminPassword={setAdminPassword}
        handleAdminLogin={handleAdminLogin}
        departmentMappings={departmentMappings}
        newPrefix={newPrefix}
        setNewPrefix={setNewPrefix}
        newDepartment={newDepartment}
        setNewDepartment={setNewDepartment}
        handleAddDepartmentMapping={handleAddDepartmentMapping}
        handleExport={handleExport}
        handleClearLogs={handleClearLogs}
        checkedOutItemsCount={checkedOutItems.length}
        recentLogsCount={recentLogs.length}
        departmentMappingsCount={departmentMappings.length}
      />

      {/* Toast notification */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        border: '2px solid #000',
        fontWeight: 'bold',
        fontSize: '14px',
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
  );
};

export default App;
