import { useState } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';

interface BarcodeGeneratorProps {
  onClose: () => void;
}

export default function BarcodeGenerator({ onClose }: BarcodeGeneratorProps) {
  const [selectedTrigger, setSelectedTrigger] = useState('SCAN_START');
  const [customText, setCustomText] = useState('');

  const predefinedTriggers = [
    'SCAN_START',
    'ACTIVATE',
    'TRIGGER',
    'START_SCAN',
    'INVENTORY_START'
  ];

  const generateBarcode = (text: string) => {
    // In a real implementation, you would use a barcode library
    // For now, we'll create a simple text representation
    return `||||| ${text} |||||`;
  };

  const handlePrint = (text: string) => {
    const printContent = `
      <html>
        <head>
          <title>Trigger Barcode - ${text}</title>
          <style>
            body { 
              font-family: monospace; 
              text-align: center; 
              padding: 20px; 
            }
            .barcode { 
              font-size: 24px; 
              letter-spacing: 2px; 
              margin: 20px 0; 
              font-weight: bold;
            }
            .text { 
              font-size: 16px; 
              margin: 10px 0; 
            }
            .instructions {
              font-size: 12px;
              color: #666;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>          <h2>Harrys lilla Lager - Trigger Barcode</h2>
          <div class="text">${text}</div>
          <div class="barcode">${generateBarcode(text)}</div>
          <div class="instructions">
            Scanna denna streckkod för att aktivera lagerskannern
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const textToUse = customText.trim() || selectedTrigger;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Trigger Barcode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Predefined Trigger
            </label>
            <select
              value={selectedTrigger}
              onChange={(e) => setSelectedTrigger(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {predefinedTriggers.map(trigger => (
                <option key={trigger} value={trigger}>
                  {trigger}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Text
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value.toUpperCase())}
              placeholder="Enter custom trigger text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Barcode Preview */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="font-mono text-lg font-bold text-gray-900 mb-2">
              {textToUse}
            </div>
            <div className="font-mono text-sm text-gray-700 letter-spacing-wide">
              {generateBarcode(textToUse)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handlePrint(textToUse)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => {
                // In a real implementation, you could generate a proper barcode file
                const element = document.createElement('a');
                const file = new Blob([`Trigger Barcode: ${textToUse}\n${generateBarcode(textToUse)}`], 
                  { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `trigger-barcode-${textToUse}.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Note: In a production environment, this would generate actual barcodes.</p>
            <p>For now, it creates printable text representations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
