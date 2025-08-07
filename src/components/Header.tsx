import React from 'react';
import { Settings, Download } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

interface HeaderProps {
  handleExport: () => void;
  setShowSettings: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ handleExport, setShowSettings }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img
          src={logoSvg}
          alt="ånej"
          style={{
            height: '48px',
            width: '48px',
            objectFit: 'contain',
            borderRadius: '8px',
            border: '2px solid #000',
            background: '#fff'
          }}
        />
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          margin: 0
        }}>
          HARRY'S LILLA LAGER
        </h1>
      </div>
      
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
  );
};

export default Header;
