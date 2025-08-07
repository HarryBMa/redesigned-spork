import React from 'react';
import { ScanLog } from '../types';

interface InventoryTableProps {
  checkedOutItems: ScanLog[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ checkedOutItems }) => {
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
        LAGER ({checkedOutItems.length} ARTIKLAR)
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
          {checkedOutItems.length === 0 ? (
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
            checkedOutItems.map((item, index) => (
              <tr
                key={`${item.barcode}-${item.id}`}
                style={{
                  borderBottom: '1px solid #333',
                  backgroundColor: index % 2 === 0 ? '#000' : '#111'
                }}
              >
                <td style={{
                  padding: '15px 20px',
                  color: '#faf8f5',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'uppercase'
                }}>
                  <div>{item.barcode}</div>
                  {item.item_name && (
                    <div style={{
                      fontSize: '12px',
                      color: '#4ade80',
                      textTransform: 'none',
                      fontWeight: 'normal',
                      marginTop: '2px'
                    }}>
                      {item.item_name}
                    </div>
                  )}
                </td>
                <td style={{
                  padding: '15px 20px',
                  color: '#ccc',
                  fontSize: '14px'
                }}>
                  {formatTimestamp(new Date(item.timestamp))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
