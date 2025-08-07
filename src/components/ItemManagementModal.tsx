import React from 'react';
import { X } from 'lucide-react';
import { Item } from '../types';

interface ItemManagementModalProps {
  showItemManagement: boolean;
  setShowItemManagement: (show: boolean) => void;
  newItemBarcode: string;
  setNewItemBarcode: (barcode: string) => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  handleAddItem: () => void;
  handleCsvUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  allItems: Item[];
  handleDeleteItem: (barcode: string) => void;
}

const ItemManagementModal: React.FC<ItemManagementModalProps> = ({
  showItemManagement,
  setShowItemManagement,
  newItemBarcode,
  setNewItemBarcode,
  newItemName,
  setNewItemName,
  handleAddItem,
  handleCsvUpload,
  allItems,
  handleDeleteItem
}) => {
  if (!showItemManagement) return null;

  return (
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
        maxWidth: '800px',
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
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0
          }}>
            ITEM MANAGEMENT
          </h3>
          <button
            onClick={() => setShowItemManagement(false)}
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

        {/* Add Single Item */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            ADD SINGLE ITEM
          </h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={newItemBarcode}
              onChange={(e) => setNewItemBarcode(e.target.value)}
              placeholder="BARCODE"
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
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="ITEM NAME"
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
              onClick={handleAddItem}
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
              ADD
            </button>
          </div>
        </div>

        {/* Bulk Import from CSV */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            BULK IMPORT FROM CSV
          </h4>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', marginBottom: '5px' }}>
              CSV format: First column = Barcode, Second column = Name
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              style={{
                padding: '8px',
                fontSize: '14px',
                fontFamily: '"Courier New", monospace',
                border: '2px solid #000',
                backgroundColor: '#fff',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Current Items List */}
        <div>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            CURRENT ITEMS ({allItems.length})
          </h4>
          <div style={{ 
            maxHeight: '300px', 
            overflow: 'auto',
            border: '2px solid #000',
            backgroundColor: '#000',
            color: '#faf8f5'
          }}>
            {allItems.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                No items found. Add some items to get started.
              </div>
            ) : (
              allItems.map((item: Item) => (
                <div
                  key={item.barcode}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderBottom: '1px solid #333',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold' }}>{item.barcode}</span>
                    <span style={{ opacity: 0.8 }}>{item.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.barcode)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontFamily: '"Courier New", monospace',
                      border: '1px solid #ef4444',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    DELETE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemManagementModal;
