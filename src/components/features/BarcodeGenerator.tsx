import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, Settings } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { invoke } from '@tauri-apps/api/core';

interface BarcodeGeneratorProps {
  onGenerate?: (barcode: string) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onGenerate }) => {
  const [prefix, setPrefix] = useState('SCAN_START');
  const [quantity, setQuantity] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({
    ip_address: '192.168.1.100',
    port: 9100,
    label_width: 203,
    label_height: 152,
    print_density: 8,
    print_speed: 6
  });
  const barcodeRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Generate barcodes on canvas elements
  useEffect(() => {
    if (generatedCodes.length > 0) {
      generatedCodes.forEach((code, index) => {
        const canvas = barcodeRefs.current[index];
        if (canvas) {
          try {
            JsBarcode(canvas, code, {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              background: "white",
              lineColor: "black"
            });
          } catch (error) {
            console.error('Error generating barcode:', error);
            // Fallback to text display
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'black';
              ctx.font = '12px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(code, canvas.width / 2, canvas.height / 2);
            }
          }
        }
      });
    }
  }, [generatedCodes]);

  const generateBarcode = () => {
    const codes: string[] = [];
    for (let i = 0; i < quantity; i++) {
      if (prefix === 'SCAN_START' || prefix === 'SCAN_END') {
        codes.push(prefix);
      } else {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        codes.push(`${prefix}${timestamp}${randomNum}`);
      }
    }
    setGeneratedCodes(codes);
    onGenerate?.(codes[0]);
  };

  const exportAsCsv = () => {
    const csvContent = 'Streckkod\n' + generatedCodes.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `barcodes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const barcodeImages = generatedCodes.map((_, index) => {
        const canvas = barcodeRefs.current[index];
        return canvas ? canvas.toDataURL() : null;
      }).filter(img => img !== null);

      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode Labels</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .barcode { 
                border: 2px solid #000; 
                margin: 10px 0; 
                padding: 20px; 
                text-align: center; 
                page-break-inside: avoid;
                max-width: 400px;
              }
              .barcode img {
                max-width: 100%;
                height: auto;
              }
              .label { 
                font-size: 14px; 
                margin: 10px 0; 
                font-weight: bold;
              }
              .code-text {
                font-family: monospace;
                font-size: 16px;
                margin: 10px 0;
              }
              @media print {
                .barcode { page-break-after: always; }
                .barcode:last-child { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>
            ${barcodeImages.map((img, index) => `
              <div class="barcode">
                <div class="label">Surgical Inventory</div>
                <img src="${img}" alt="Barcode ${generatedCodes[index]}" />
                <div class="code-text">${generatedCodes[index]}</div>
                <div class="label">${new Date().toLocaleDateString()}</div>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Load printer settings on component mount
  useEffect(() => {
    const loadPrinterSettings = async () => {
      try {
        const settings = await invoke('get_printer_settings');
        setPrinterSettings(settings as any);
      } catch (error) {
        console.error('Failed to load printer settings:', error);
      }
    };
    loadPrinterSettings();
  }, []);

  const printToZebraPrinter = async () => {
    if (generatedCodes.length === 0) {
      alert('Inga streckkoder att skriva ut');
      return;
    }

    try {
      await invoke('print_barcodes_to_zebra', {
        barcodes: generatedCodes,
        department: prefix === 'SCAN_START' || prefix === 'SCAN_END' ? 'Trigger Code' : 'Test Item'
      });
      alert(`${generatedCodes.length} etiketter skickade till Zebra-skrivaren!`);
    } catch (error) {
      console.error('Zebra print error:', error);
      alert(`Fel vid utskrift: ${error}`);
    }
  };

  const testZebraPrinter = async () => {
    try {
      await invoke('test_zebra_printer');
      alert('Zebra-skrivaren svarar!');
    } catch (error) {
      console.error('Zebra test error:', error);
      alert(`Kan inte ansluta till skrivaren: ${error}`);
    }
  };

  const printTestLabel = async () => {
    try {
      await invoke('print_test_label');
      alert('Testetiketten skickad till skrivaren!');
    } catch (error) {
      console.error('Test label error:', error);
      alert(`Fel vid testutskrift: ${error}`);
    }
  };

  const savePrinterSettings = async () => {
    try {
      await invoke('set_printer_settings', { settings: printerSettings });
      alert('Skrivarinställningar sparade!');
      setShowPrinterSettings(false);
    } catch (error) {
      console.error('Failed to save printer settings:', error);
      alert(`Fel vid sparande: ${error}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-slate-300 text-sm mb-2 block">Prefix/Type</label>
          <select
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="SCAN_START">Trigger: Starta session</option>
            <option value="SCAN_END">Trigger: Avsluta session</option>
            <option value="TEST">Testföremål</option>
          </select>
        </div>
        
        <div>
          <label className="text-slate-300 text-sm mb-2 block">Antal</label>
          <input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <button onClick={generateBarcode} className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
        Generera streckkoder
      </button>

      {generatedCodes.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-600/50">
            <h4 className="text-slate-100 font-semibold mb-4">Genererade streckkoder:</h4>
            <div className="space-y-4">
              {generatedCodes.map((code, index) => (
                <div key={index} className="bg-slate-800/50 p-4 rounded-xl border border-slate-600/50 shadow-sm">
                  <div className="text-center mb-2">
                    <canvas
                      ref={(el) => {
                        if (barcodeRefs.current) {
                          barcodeRefs.current[index] = el;
                        }
                      }}
                      className="mx-auto bg-white rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-mono text-sm">{code}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-100 text-xs rounded-lg transition-all duration-200"
                    >
                      Kopiera
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <button onClick={exportAsCsv} className="flex-1 flex items-center justify-center p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Download className="h-4 w-4 mr-2" />
                Exportera CSV
              </button>
              <button onClick={printBarcodes} className="flex-1 p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                Skriv ut etiketter
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button onClick={printToZebraPrinter} className="flex-1 flex items-center justify-center p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Printer className="h-4 w-4 mr-2" />
                Zebra ZD400
              </button>
              <button onClick={testZebraPrinter} className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                Testa anslutning
              </button>
              <button onClick={() => setShowPrinterSettings(!showPrinterSettings)} className="p-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showPrinterSettings && (
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 space-y-4">
              <h4 className="text-slate-100 font-semibold mb-3">Zebra ZD400 Inställningar</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">IP-adress</label>
                  <input
                    type="text"
                    value={printerSettings.ip_address}
                    onChange={(e) => setPrinterSettings(prev => ({ ...prev, ip_address: e.target.value }))}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="192.168.1.100"
                  />
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Port</label>
                  <input
                    type="number"
                    value={printerSettings.port}
                    onChange={(e) => setPrinterSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 9100 }))}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Etikett bredd (DPI)</label>
                  <input
                    type="number"
                    value={printerSettings.label_width}
                    onChange={(e) => setPrinterSettings(prev => ({ ...prev, label_width: parseInt(e.target.value) || 203 }))}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Etikett höjd (DPI)</label>
                  <input
                    type="number"
                    value={printerSettings.label_height}
                    onChange={(e) => setPrinterSettings(prev => ({ ...prev, label_height: parseInt(e.target.value) || 152 }))}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button onClick={savePrinterSettings} className="flex-1 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-300">
                  Spara inställningar
                </button>
                <button onClick={printTestLabel} className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300">
                  Skriv testetik​ett
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeGenerator;
