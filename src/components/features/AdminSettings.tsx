import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { X, Download, Trash2, Building2, Plus, QrCode } from 'lucide-react';
import logoSvg from '../../assets/logo.svg';
import { useModal } from '../ui/custom-modal';
import BarcodeGenerator from './BarcodeGenerator';

interface DepartmentMapping {
  prefix: string;
  department: string;
}

interface ScanLog {
  id: number;
  timestamp: string;
  barcode: string;
  action: string;
  department?: string;
}

interface AdminSettingsProps {
  onClose: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const { showAlert, showConfirm } = useModal();
  const [departmentMappings, setDepartmentMappings] = useState<DepartmentMapping[]>([]);
  const [checkedOutItems, setCheckedOutItems] = useState<ScanLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  const [newPrefix, setNewPrefix] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    loadData();
    
    // Set up event listeners for real-time updates
    const setupListeners = async () => {
      await listen('barcode-scanned', () => {
        loadData(); // Refresh when items are scanned
      });
      
      await listen('manual-scan-complete', () => {
        loadData(); // Refresh when manual scan completes
      });
    };

    setupListeners();
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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAdminLogin = async () => {
    if (adminPassword === 'demoHH') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      await showAlert('Fel lösenord', 'Felaktigt lösenord. Försök igen.');
      setAdminPassword('');
    }
  };

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
    } catch (error) {
      console.error('Error adding department mapping:', error);
    }
  };

  const handleRemoveDepartmentMapping = async (prefix: string) => {
    const confirmed = await showConfirm(
      'Bekräfta borttagning', 
      `Är du säker på att du vill ta bort avdelningen med prefix "${prefix}"?`
    );
    
    if (!confirmed) return;
    
    try {
      await invoke('delete_department_mapping', { prefix });
      loadData();
    } catch (error) {
      console.error('Error removing department mapping:', error);
      await showAlert('Fel', 'Fel vid borttagning av avdelning. Försök igen.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `surgical_logs_${timestamp}.csv`;
      await invoke('export_logs_csv', { filePath: filename, limit: null });
      await showAlert('Export klar', 'Export genomförd framgångsrikt!');
    } catch (error) {
      console.error('Error exporting:', error);
      await showAlert('Export misslyckades', 'Export misslyckades. Försök igen.');
    }
  };

  const handleClearLogs = async () => {
    const confirmed = await showConfirm(
      'Bekräfta rensning', 
      'Är du säker på att du vill radera alla loggar? Detta går inte att ångra.'
    );
    
    if (!confirmed) return;
    
    try {
      await invoke('clear_all_logs');
      loadData();
      await showAlert('Loggar rensade', 'Alla loggar har raderats framgångsrikt!');
    } catch (error) {
      console.error('Error clearing logs:', error);
      await showAlert('Fel', 'Misslyckades med att radera loggar. Försök igen.');
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m sedan`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h sedan`;
    const days = Math.floor(hours / 24);
    return `${days}d sedan`;
  };

  const groupItemsByDepartment = () => {
    const grouped: { [key: string]: ScanLog[] } = {};
    
    checkedOutItems.forEach(item => {
      const department = item.department || 'Okänd avdelning';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(item);
    });

    return grouped;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-background w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
              <img 
                src={logoSvg} 
                alt="Harry's Lilla Lager Logo" 
                className="w-6 h-6 filter invert"
              />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-all duration-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          
          {/* Admin Login */}
          {!isAdminUnlocked ? (
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Ah ah ah! You didn't say the magic word!</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter admin password..."
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <button 
                    onClick={handleAdminLogin}
                    className="w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Department Mappings */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Enhetskonfig
                </h3>
                
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <input
                      placeholder="Prefix (e.g. KÄKX)"
                      value={newPrefix}
                      onChange={(e) => setNewPrefix(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                    />
                    <input
                      placeholder="Enhet"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                    />
                    <button 
                      onClick={handleAddDepartmentMapping}
                      className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {departmentMappings.length > 0 && (
                    <div className="space-y-2">
                      {departmentMappings.map((mapping, index) => (
                        <div key={index} className="bg-white/5 backdrop-blur-md rounded-xl p-4 shadow-inner border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-indigo-400">{mapping.prefix}</span>
                              <span className="text-white/60">→</span>
                              <span className="text-white">{mapping.department}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveDepartmentMapping(mapping.prefix)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-105 active:scale-95"
                              title="Ta bort avdelning"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode Generator */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Streckkodsgenerator
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Skapa streckkoder för SCAN_START-triggers och andra systemfunktioner
                </p>
                <BarcodeGenerator />
              </div>

              {/* Export & Data Management */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Datalog</h3>
                
                <div className="flex space-x-4">
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportera CSV
                  </button>
                  
                  <button 
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera alla loggar
                  </button>
                </div>
              </div>

              {/* Checked Out Items by Enhet */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Utcheckade artiklar efter Enhet</h3>

                {checkedOutItems.length === 0 ? (
                  <p className="text-white/60">Inga utcheckade artiklar</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupItemsByDepartment()).map(([department, items]) => (
                      <div key={department} className="bg-white/5 backdrop-blur-md rounded-xl p-4 shadow-inner border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-indigo-400 font-semibold">{department}</h4>
                          <span className="text-white/60 text-sm">{items.length} items</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-white text-sm">{item.barcode}</span>
                                <span className="text-white/60 text-xs">{formatTimeAgo(item.timestamp)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-inner border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Senaste Aktivitet</h3>

                {recentLogs.length === 0 ? (
                  <p className="text-white/60">Ingen senaste aktivitet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-white">{log.barcode}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === 'check-out' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {log.action === 'check-out' ? 'checked out' : log.action === 'check-in' ? 'checked in' : log.action}
                            </span>
                            {log.department && (
                              <span className="text-indigo-400 text-sm">{log.department}</span>
                            )}
                          </div>
                          <span className="text-white/60 text-sm">{formatDateTime(log.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
