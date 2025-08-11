import React from 'react';

interface Article {
  id: string;
  displayName: string;
  timestamp: Date;
}

interface InventoryTableProps {
  articles: Article[];
  formatTimestamp: (timestamp: Date) => string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ articles, formatTimestamp }) => (
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
                {article.displayName}
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
);

export default InventoryTable;
