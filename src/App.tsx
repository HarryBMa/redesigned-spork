import React, { useState, useEffect, useRef } from 'react';

// Type definition for inventory articles
interface Article {
  id: string;
  timestamp: Date;
}

const App: React.FC = () => {
  // State to manage the list of registered articles
  const [articles, setArticles] = useState<Article[]>([]);
  
  // State to manage the current input value
  const [itemId, setItemId] = useState<string>('');

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
  }, []);

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
   * Core logic: Add item if not exists, remove if exists
   */
  const handleScan = () => {
    // Trim whitespace and validate input
    const trimmedId = itemId.trim();
    if (!trimmedId) {
      showToast('Please enter a valid item ID', 'error');
      return;
    }

    // Check if item already exists in the list
    const existingItemIndex = articles.findIndex(article => article.id === trimmedId);
    
    if (existingItemIndex !== -1) {
      // Item exists - remove it from the list
      setArticles(prevArticles => 
        prevArticles.filter(article => article.id !== trimmedId)
      );
      
      // Show warning toast for removal
      showToast(`Item removed: ${trimmedId}`, 'warning');
    } else {
      // Item doesn't exist - add it to the list
      const newArticle: Article = {
        id: trimmedId,
        timestamp: new Date()
      };
      
      // Add new item to the beginning of the array (most recent first)
      setArticles(prevArticles => [newArticle, ...prevArticles]);
      
      // Show success toast for addition
      showToast(`Item added: ${trimmedId}`, 'success');
    }
    
    // Clear the input field after submission and refocus
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
            placeholder="SCAN OR ENTER ITEM ID..."
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
            INVENTORY ({articles.length} ITEMS)
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
                  ITEM ID
                </th>
                <th style={{
                  padding: '15px 20px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderBottom: '2px solid #333'
                }}>
                  TIMESTAMP
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
                      NO ITEMS REGISTERED
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
