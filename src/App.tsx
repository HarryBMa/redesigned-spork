import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Settings, Download, Trash2, Plus, QrCode, X } from 'lucide-react';
import BarcodeGenerator from './components/features/BarcodeGenerator';

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
        <div style={{
          backgroundColor: '#faf8f5',
          border: '3px solid #000',
          padding: '30px',
          marginBottom: '40px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={itemId}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="SCANNA ELLER SKRIV IN ARTIKEL ID..."
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

        {/* Inventory List */}
        <div style={{
          backgroundColor: '#faf8f5',
          border: '3px solid #000'
        }}>
          <div style={{
            backgroundColor: '#000',
            color: '#faf8f5',
            padding: '20px',
            fontSize: '20px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
          LAGER ({articles.length} ARTIKLAR)
          </div>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#000'
          }}>
            <thead style={{
              backgroundColor: '#000',
              color: '#faf8f5'
            }}>
              <tr>
                <th style={{
                  padding: '15px 20px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #333'
                }}>
                  ARTIKEL ID
                </th>
                <th style={{
                  padding: '15px 20px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #333'
                }}>
                  TIDPUNKT
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr style={{
                  borderBottom: '1px solid #333'
                }}>
                  <td colSpan={2} style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#666',
                    backgroundColor: '#000'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}>
                      INGA ARTIKLAR REGISTRERADE
                    </div>
                  </td>
                </tr>
              ) : (
                articles.map((article, index) => (
                  <tr
                    key={`${article.id}-${article.timestamp.getTime()}`}
                    style={{
                      borderBottom: '1px solid #333',
                      backgroundColor: index % 2 === 0 ? '#000' : '#111'
                    }}
                  >
                    <td style={{
                      padding: '15px 20px',
                      color: '#faf8f5',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {article.id}
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      color: '#ccc',
                      fontSize: '14px'
                    }}>
                      {formatTimestamp(article.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#faf8f5',
            border: '3px solid #000',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: 0
              }}>
                ADMIN SETTINGS
              </h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setIsAdminUnlocked(false);
                  setAdminPassword('');
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '14px',
                  fontFamily: '"Courier New", monospace',
                  border: '2px solid #000',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {!isAdminUnlocked ? (
              <div>
                <p style={{ marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Ah ah ah! You didn't say the magic word!
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '16px',
                      fontFamily: '"Courier New", monospace',
                      border: '2px solid #000',
                      backgroundColor: '#fff',
                      outline: 'none'
                    }}
                    placeholder="Password..."
                  />
                  <button
                    onClick={handleAdminLogin}
                    style={{
                      padding: '10px 20px',
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
                  >
                    LOGIN
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Department Mappings */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '10px'
                  }}>
                    DEPARTMENT MAPPINGS
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      value={newPrefix}
                      onChange={(e) => setNewPrefix(e.target.value)}
                      placeholder="PREFIX"
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '14px',
                        fontFamily: '"Courier New", monospace',
                        border: '2px solid #000',
                        backgroundColor: '#fff',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                    />
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="DEPARTMENT"
                      style={{
                        flex: 2,
                        padding: '8px',
                        fontSize: '14px',
                        fontFamily: '"Courier New", monospace',
                        border: '2px solid #000',
                        backgroundColor: '#fff',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleAddDepartmentMapping}
                      style={{
                        padding: '8px 15px',
                        fontSize: '12px',
                        fontFamily: '"Courier New", monospace',
                        border: '2px solid #000',
                        backgroundColor: '#4ade80',
                        color: '#000',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <Plus style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>

                  <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                    {departmentMappings.map((mapping) => (
                      <div
                        key={mapping.prefix}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: '#000',
                          color: '#faf8f5',
                          marginBottom: '2px',
                          fontSize: '14px'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{mapping.prefix}</span>
                        <span>{mapping.department}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleExport}
                    style={{
                      padding: '10px 15px',
                      fontSize: '12px',
                      fontFamily: '"Courier New", monospace',
                      border: '2px solid #000',
                      backgroundColor: '#4ade80',
                      color: '#000',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 'bold'
                    }}
                  >
                    <Download style={{ width: '14px', height: '14px', marginRight: '5px' }} />
                    EXPORT
                  </button>

                  <button
                    onClick={handleClearLogs}
                    style={{
                      padding: '10px 15px',
                      fontSize: '12px',
                      fontFamily: '"Courier New", monospace',
                      border: '2px solid #000',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 'bold'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px', marginRight: '5px' }} />
                    CLEAR LOGS
                  </button>

                  <button
                    onClick={() => setShowBarcodeGenerator(true)}
                    style={{
                      padding: '10px 15px',
                      fontSize: '12px',
                      fontFamily: '"Courier New", monospace',
                      border: '2px solid #000',
                      backgroundColor: '#fbbf24',
                      color: '#000',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 'bold'
                    }}
                  >
                    <QrCode style={{ width: '14px', height: '14px', marginRight: '5px' }} />
                    GENERATE CODES
                  </button>
                </div>

                {/* Items Summary */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '10px'
                  }}>
                    CURRENT STATUS
                  </h3>
                  <div style={{
                    backgroundColor: '#000',
                    color: '#faf8f5',
                    padding: '15px',
                    fontSize: '14px'
                  }}>
                    <div>CHECKED OUT ITEMS: {checkedOutItems.length}</div>
                    <div>RECENT LOGS: {recentLogs.length}</div>
                    <div>DEPARTMENT MAPPINGS: {departmentMappings.length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barcode Generator Modal */}
      {showBarcodeGenerator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#faf8f5',
            border: '3px solid #000',
            padding: '20px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: 0
              }}>
                BARCODE GENERATOR
              </h3>
              <button
                onClick={() => setShowBarcodeGenerator(false)}
                style={{
                  padding: '5px 10px',
                  fontSize: '14px',
                  fontFamily: '"Courier New", monospace',
                  border: '2px solid #000',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            <BarcodeGenerator />
          </div>
        </div>
      )}

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
