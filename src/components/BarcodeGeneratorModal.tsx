import React from 'react';
import { X } from 'lucide-react';
import BarcodeGenerator from './features/BarcodeGenerator';

interface BarcodeGeneratorModalProps {
  showBarcodeGenerator: boolean;
  setShowBarcodeGenerator: (show: boolean) => void;
}

const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  showBarcodeGenerator,
  setShowBarcodeGenerator
}) => {
  if (!showBarcodeGenerator) return null;

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
  );
};

export default BarcodeGeneratorModal;
