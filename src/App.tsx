import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Settings, Download } from 'lucide-react';
import InputSection from './components/InputSection';
import InventoryTable from './components/InventoryTable';
import AdminSettingsModal from './components/AdminSettingsModal';
import logoSvg from './assets/logo.svg';

// Type definitions
interface Article {
  id: string;
  displayName: string;
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

interface InventoryItem {
  barcode: string;
  department?: string;
  description?: string;
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
  // Items catalogue state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [newItemBarcode, setNewItemBarcode] = useState("");
  const [newItemDepartment, setNewItemDepartment] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

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

  const inputRef = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);
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
      const [logs, mappings, checkedOut, allItems] = await Promise.all([
        invoke<ScanLog[]>('get_recent_logs', { limit: 100 }),
        invoke<DepartmentMapping[]>('get_department_mappings'),
        invoke<ScanLog[]>('get_checked_out_items'),
        invoke<InventoryItem[]>('get_items', { limit: 500 })
      ]);
      
      setRecentLogs(logs);
      setDepartmentMappings(mappings);
  setCheckedOutItems(checkedOut);
  setItems(allItems);
      
      // Convert checked out items to local articles format for display
      const convertedArticles = await Promise.all(checkedOut.map(async item => {
        try {
          const displayName = await invoke<string>('get_item_display_name', { barcode: item.barcode });
          return {
            id: item.barcode,
            displayName: displayName,
            timestamp: new Date(item.timestamp)
          };
        } catch (error) {
          return {
            id: item.barcode,
            displayName: item.barcode.toUpperCase(),
            timestamp: new Date(item.timestamp)
          };
        }
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
    // Trim whitespace, convert to uppercase, and validate input
    const trimmedId = itemId.trim().toUpperCase();
    if (!trimmedId) {
      showToast('Please enter a valid item ID', 'error');
      return;
    }

    // Clear any pending timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    try {
      // Use Tauri backend for scanning if available (already uppercase)
      const result = await invoke<any>('manual_scan_barcode', { barcode: trimmedId });
      showToast(`Item ${result.action}: ${trimmedId}`, 'success');
      
      // Clear the input field and refocus after successful scan
      setItemId('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error scanning barcode:', error);
      showToast(`Scan failed: ${error}`, 'error');
      
      // Clear the input field even on error and refocus
      setItemId('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
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

  const handleUpdateDepartmentMapping = async (oldPrefix: string, updatedPrefix: string, updatedDepartment: string) => {
    try {
      // If prefix changed, delete old then add new to keep PK integrity
      if (oldPrefix !== updatedPrefix) {
        await invoke('delete_department_mapping', { prefix: oldPrefix });
      }
      await invoke('set_department_mapping', { prefix: updatedPrefix.toUpperCase(), department: updatedDepartment });
      loadData();
      showToast('Department mapping updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to update mapping', 'error');
    }
  };

  const handleDeleteDepartmentMapping = async (prefix: string) => {
    try {
      await invoke('delete_department_mapping', { prefix });
      loadData();
      showToast('Department mapping deleted', 'warning');
    } catch (e) {
      console.error(e);
      showToast('Failed to delete mapping', 'error');
    }
  };

  // Items CRUD
  const handleAddItem = async () => {
    if (!newItemBarcode.trim()) return;
    try {
      await invoke('add_item', { barcode: newItemBarcode.toUpperCase(), department: newItemDepartment || null, description: newItemDescription || null });
      setNewItemBarcode("");
      setNewItemDepartment("");
      setNewItemDescription("");
      loadData();
      showToast('Item saved', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save item', 'error');
    }
  };

  const handleUpdateItem = async (barcode: string, department?: string, description?: string) => {
    try {
      await invoke('update_item', { barcode, department: department || null, description: description || null });
      loadData();
      showToast('Item updated', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (barcode: string) => {
    try {
      await invoke('delete_item', { barcode });
      loadData();
      showToast('Item deleted', 'warning');
    } catch (e) {
      console.error(e);
      showToast('Failed to delete item', 'error');
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
   * Import item names from list
   */
  const handleImportItemNames = async (items: Array<[string, string]>) => {
    try {
      const count = await invoke<number>('import_item_names', { items });
      showToast(`Successfully imported ${count} item names`, 'success');
      loadData(); // Refresh the display to show updated names
    } catch (error) {
      console.error('Error importing item names:', error);
      showToast('Failed to import item names', 'error');
    }
  };

  /**
   * Handle input change with automatic submission detection
   * Barcode scanners typically input data very quickly, so we'll use a timer
   * to detect when input has stopped and automatically submit
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase(); // Convert to uppercase automatically
    setItemId(newValue);

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Set a new timeout to auto-submit after a longer delay for manual typing
    // Only auto-submit if the input looks like a complete barcode (length > 3)
    if (newValue.trim() && newValue.length > 3) {
      scanTimeoutRef.current = setTimeout(() => {
        // Only auto-submit if the input hasn't changed in the last 1.5 seconds
        if (itemId === newValue) {
          handleScan();
        }
      }, 1500); // 1.5 second delay - prevents premature submission during manual typing
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
          <img src={logoSvg} alt="Logo" style={{ display:'flex', maxHeight: '50px', border: '2px solid #000', backgroundColor: '#ffffffff' }} />
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
  handleUpdateDepartmentMapping={handleUpdateDepartmentMapping}
  handleDeleteDepartmentMapping={handleDeleteDepartmentMapping}
  items={items}
  newItemBarcode={newItemBarcode}
  setNewItemBarcode={setNewItemBarcode}
  newItemDepartment={newItemDepartment}
  setNewItemDepartment={setNewItemDepartment}
  newItemDescription={newItemDescription}
  setNewItemDescription={setNewItemDescription}
  handleAddItem={handleAddItem}
  handleUpdateItem={handleUpdateItem}
  handleDeleteItem={handleDeleteItem}
        handleExport={handleExport}
        handleClearLogs={handleClearLogs}
        handleImportItemNames={handleImportItemNames}
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
