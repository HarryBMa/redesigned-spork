import React from 'react';
import { X, Plus, Download, Trash2, Edit2, Save, XCircle } from 'lucide-react';

interface DepartmentMapping {
  prefix: string;
  department: string;
}

interface InventoryItem {
  barcode: string;
  department?: string;
  description?: string;
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
  handleUpdateDepartmentMapping: (oldPrefix: string, newPrefix: string, newDepartment: string) => void;
  handleDeleteDepartmentMapping: (prefix: string) => void;
  items: InventoryItem[];
  newItemBarcode: string;
  setNewItemBarcode: (v: string) => void;
  newItemDepartment: string;
  setNewItemDepartment: (v: string) => void;
  newItemDescription: string;
  setNewItemDescription: (v: string) => void;
  handleAddItem: () => void;
  handleUpdateItem: (barcode: string, department: string | undefined, description: string | undefined) => void;
  handleDeleteItem: (barcode: string) => void;
  handleExport: () => void;
  handleClearLogs: () => void;
  handleImportItemNames: (items: Array<[string, string]>) => void;
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
  handleUpdateDepartmentMapping,
  handleDeleteDepartmentMapping,
  items,
  newItemBarcode,
  setNewItemBarcode,
  newItemDepartment,
  setNewItemDepartment,
  newItemDescription,
  setNewItemDescription,
  handleAddItem,
  handleUpdateItem,
  handleDeleteItem,
  handleExport,
  handleClearLogs,
  handleImportItemNames,
  checkedOutItemsCount,
  recentLogsCount,
  departmentMappingsCount
}) => {
  if (!show) return null;
  const [editingDept, setEditingDept] = React.useState<string | null>(null);
  const [editPrefix, setEditPrefix] = React.useState("");
  const [editDepartment, setEditDepartment] = React.useState("");
  const startEditDept = (m: DepartmentMapping) => {
    setEditingDept(m.prefix);
    setEditPrefix(m.prefix);
    setEditDepartment(m.department);
  };
  const saveEditDept = () => {
    if (editingDept) {
      handleUpdateDepartmentMapping(editingDept, editPrefix, editDepartment);
      setEditingDept(null);
    }
  };
  const cancelEditDept = () => { setEditingDept(null); };

  const [editingItem, setEditingItem] = React.useState<string | null>(null);
  const [editItemDepartment, setEditItemDepartment] = React.useState("");
  const [editItemDescription, setEditItemDescription] = React.useState("");
  const startEditItem = (it: InventoryItem) => {
    setEditingItem(it.barcode);
    setEditItemDepartment(it.department || "");
    setEditItemDescription(it.description || "");
  };
  const saveEditItem = () => {
    if (editingItem) {
      handleUpdateItem(editingItem, editItemDepartment || undefined, editItemDescription || undefined);
      setEditingItem(null);
    }
  };
  const cancelEditItem = () => setEditingItem(null);
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
              <div style={{ maxHeight: '160px', overflow: 'auto' }}>
                {departmentMappings.map((mapping) => {
                  const isEditing = editingDept === mapping.prefix;
                  return (
                    <div key={mapping.prefix} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px', backgroundColor:'#000', color:'#faf8f5', marginBottom:'2px', fontSize:'12px' }}>
                      {isEditing ? (
                        <>
                          <input value={editPrefix} onChange={e=>setEditPrefix(e.target.value.toUpperCase())} style={{ width:'70px', fontSize:'12px'}} />
                          <input value={editDepartment} onChange={e=>setEditDepartment(e.target.value)} style={{ flex:1, fontSize:'12px'}} />
                          <button onClick={saveEditDept} style={{ background:'#4ade80', border:'1px solid #fff', cursor:'pointer' }}><Save style={{ width:14}} /></button>
                          <button onClick={cancelEditDept} style={{ background:'#ef4444', border:'1px solid #fff', cursor:'pointer' }}><XCircle style={{ width:14}} /></button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight:'bold', width:'70px'}}>{mapping.prefix}</span>
                          <span style={{ flex:1 }}>{mapping.department}</span>
                          <button onClick={()=>startEditDept(mapping)} style={{ background:'#4ade80', border:'1px solid #fff', cursor:'pointer' }}><Edit2 style={{ width:14}} /></button>
                          <button onClick={()=>handleDeleteDepartmentMapping(mapping.prefix)} style={{ background:'#ef4444', border:'1px solid #fff', cursor:'pointer' }}><Trash2 style={{ width:14}} /></button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Items Catalogue */}
            <div>
              <h3 style={{ fontSize:'16px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>ITEMS</h3>
              <div style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
                <input value={newItemBarcode} onChange={e=>setNewItemBarcode(e.target.value.toUpperCase())} placeholder="BARCODE" style={{ flex:1, padding:'6px', border:'2px solid #000', fontSize:'12px'}} />
                <input value={newItemDepartment} onChange={e=>setNewItemDepartment(e.target.value)} placeholder="DEPARTMENT" style={{ flex:1, padding:'6px', border:'2px solid #000', fontSize:'12px'}} />
                <input value={newItemDescription} onChange={e=>setNewItemDescription(e.target.value)} placeholder="DESCRIPTION" style={{ flex:2, padding:'6px', border:'2px solid #000', fontSize:'12px'}} />
                <button onClick={handleAddItem} style={{ padding:'6px 10px', border:'2px solid #000', background:'#4ade80', cursor:'pointer' }}><Plus style={{ width:14}} /></button>
              </div>
              <div style={{ maxHeight:'160px', overflow:'auto', border:'1px solid #000' }}>
                {items.map(it => {
                  const isEditing = editingItem === it.barcode;
                  return (
                    <div key={it.barcode} style={{ display:'flex', gap:'6px', alignItems:'center', padding:'4px 6px', background:'#000', color:'#faf8f5', fontSize:'12px', marginBottom:'2px' }}>
                      <span style={{ fontWeight:'bold', width:'90px' }}>{it.barcode}</span>
                      {isEditing ? (
                        <>
                          <input value={editItemDepartment} onChange={e=>setEditItemDepartment(e.target.value)} style={{ width:'120px', fontSize:'12px'}} />
                          <input value={editItemDescription} onChange={e=>setEditItemDescription(e.target.value)} style={{ flex:1, fontSize:'12px'}} />
                          <button onClick={saveEditItem} style={{ background:'#4ade80', border:'1px solid #fff', cursor:'pointer' }}><Save style={{ width:14}} /></button>
                          <button onClick={cancelEditItem} style={{ background:'#ef4444', border:'1px solid #fff', cursor:'pointer' }}><XCircle style={{ width:14}} /></button>
                        </>
                      ) : (
                        <>
                          <span style={{ width:'120px' }}>{it.department || '-'}</span>
                          <span style={{ flex:1 }}>{it.description || ''}</span>
                          <button onClick={()=>startEditItem(it)} style={{ background:'#4ade80', border:'1px solid #fff', cursor:'pointer' }}><Edit2 style={{ width:14}} /></button>
                          <button onClick={()=>handleDeleteItem(it.barcode)} style={{ background:'#ef4444', border:'1px solid #fff', cursor:'pointer' }}><Trash2 style={{ width:14}} /></button>
                        </>
                      )}
                    </div>
                  );
                })}
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
              
              {/* Import Item Names Section */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px'
                }}>
                  IMPORT ITEM NAMES
                </h3>
                <div style={{
                  backgroundColor: '#f0f0f0',
                  padding: '15px',
                  border: '2px solid #000',
                  marginBottom: '15px'
                }}>
                  <p style={{ 
                    fontSize: '12px', 
                    marginBottom: '10px',
                    lineHeight: '1.4'
                  }}>
                    Format: One line per item with "BARCODE,NAME"<br/>
                    Example: KÄKX001,KÄKLED
                  </p>
                  <textarea
                    placeholder="KÄKX001,KÄKLED&#10;KÄKX002,KÄKSPATEL&#10;ORTX001,ORTHOSKRUV"
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '10px',
                      fontSize: '12px',
                      fontFamily: '"Courier New", monospace',
                      border: '2px solid #000',
                      backgroundColor: '#fff',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    id="importTextarea"
                  />
                  <button
                    onClick={() => {
                      const textarea = document.getElementById('importTextarea') as HTMLTextAreaElement;
                      if (textarea?.value.trim()) {
                        const lines = textarea.value.trim().split('\n');
                        const items: Array<[string, string]> = [];
                        
                        for (const line of lines) {
                          const [barcode, name] = line.split(',').map(s => s.trim());
                          if (barcode && name) {
                            items.push([barcode, name]);
                          }
                        }
                        
                        if (items.length > 0) {
                          handleImportItemNames(items);
                          textarea.value = '';
                        }
                      }
                    }}
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
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    IMPORT NAMES
                  </button>
                </div>
              </div>
              
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
