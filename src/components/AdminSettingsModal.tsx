import React from 'react';
import { X, Plus, Download, Trash2 } from 'lucide-react';

interface DepartmentMapping {
  prefix: string;
  department: string;
}

interface AdminSettingsModalProps {
  show: boolean;
  isAdminUnlocked: boolean;
  adminPassword: string;
  setShow: (show: boolean) => void;
  setIsAdminUnlocked: (unlocked: boolean) => void;
  setAdminPassword: (pw: string) => void;
  handleAdminLogin: () => void;
  departmentMappings: DepartmentMapping[];
  newPrefix: string;
  setNewPrefix: (prefix: string) => void;
  newDepartment: string;
  setNewDepartment: (dep: string) => void;
  handleAddDepartmentMapping: () => void;
  handleExport: () => void;
  handleClearLogs: () => void;
  checkedOutItemsCount: number;
  recentLogsCount: number;
  departmentMappingsCount: number;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  show,
  isAdminUnlocked,
  adminPassword,
  setShow,
  setIsAdminUnlocked,
  setAdminPassword,
  handleAdminLogin,
  departmentMappings,
  newPrefix,
  setNewPrefix,
  newDepartment,
  setNewDepartment,
  handleAddDepartmentMapping,
  handleExport,
  handleClearLogs,
  checkedOutItemsCount,
  recentLogsCount,
  departmentMappingsCount
}) => {
  if (!show) return null;
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
              setShow(false);
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
                  <div>CHECKED OUT ITEMS: {checkedOutItemsCount}</div>
                  <div>RECENT LOGS: {recentLogsCount}</div>
                  <div>DEPARTMENT MAPPINGS: {departmentMappingsCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsModal;
