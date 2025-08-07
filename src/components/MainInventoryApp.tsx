import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useScannerLogic } from '../hooks/useScannerLogic';
import { useDataManagement } from '../hooks/useDataManagement';
import { useToast } from '../hooks/useToast';
import { useAdminLogic } from '../hooks/useAdminLogic';
import Header from './Header';
import InputSection from './InputSection';
import InventoryTable from './InventoryTable';
import AdminSettingsModal from './AdminSettingsModal';
import BarcodeGeneratorModal from './BarcodeGeneratorModal';
import ItemManagementModal from './ItemManagementModal';
import ToastNotification from './ToastNotification';

// Main inventory application component
const MainInventoryApp: React.FC = () => {
  const { toast, showToast } = useToast();
  
  const {
    checkedOutItems,
    recentLogs,
    departmentMappings,
    allItems,
    loadData,
    loadItems,
    handleExport: dataHandleExport,
    handleClearLogs: dataHandleClearLogs
  } = useDataManagement();

  const {
    itemId,
    setArticles,
    inputRef,
    handleInputChange: scannerHandleInputChange,
    handleKeyDown: scannerHandleKeyDown
  } = useScannerLogic();

  const {
    showSettings,
    setShowSettings,
    isAdminUnlocked,
    setIsAdminUnlocked,
    adminPassword,
    setAdminPassword,
    newPrefix,
    setNewPrefix,
    newDepartment,
    setNewDepartment,
    showBarcodeGenerator,
    setShowBarcodeGenerator,
    showItemManagement,
    setShowItemManagement,
    newItemBarcode,
    setNewItemBarcode,
    newItemName,
    setNewItemName,
    handleAdminLogin: adminHandleLogin,
    handleAddDepartmentMapping: adminHandleAddDepartmentMapping,
    handleAddItem: adminHandleAddItem,
    handleCsvImport: adminHandleCsvImport,
    handleCsvUpload: adminHandleCsvUpload,
    handleDeleteItem: adminHandleDeleteItem
  } = useAdminLogic();

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    loadData();
    
    // Set up event listeners for real-time updates from Tauri backend
    const setupListeners = async () => {
      await listen('barcode-scanned', (event: any) => {
        console.log('Barcode scanned:', event.payload);
        loadData();
      });

      await listen('manual-scan-complete', (event: any) => {
        console.log('Manual scan complete:', event.payload);
        loadData();
      });
    };

    setupListeners();

    // Set up periodic refresh to catch any missed updates
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update articles when checked out items change
  useEffect(() => {
    const convertedArticles = checkedOutItems.map(item => ({
      id: item.barcode,
      timestamp: new Date(item.timestamp)
    }));
    setArticles(convertedArticles);
  }, [checkedOutItems, setArticles]);

  // Wrapper functions to handle dependencies
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    scannerHandleInputChange(e, showToast, loadData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    scannerHandleKeyDown(e, showToast, loadData);
  };

  const handleExport = () => {
    dataHandleExport(showToast);
  };

  const handleClearLogs = () => {
    dataHandleClearLogs(showToast);
  };

  const handleAdminLogin = () => {
    adminHandleLogin(showToast, loadItems);
  };

  const handleAddDepartmentMapping = () => {
    adminHandleAddDepartmentMapping(loadData, showToast);
  };

  const handleAddItem = () => {
    adminHandleAddItem(loadItems, showToast);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    adminHandleCsvUpload(event, loadItems, showToast);
  };

  const handleCsvImport = (file: File) => {
    adminHandleCsvImport(file, loadItems, showToast);
  };

  const handleDeleteItem = (barcode: string) => {
    adminHandleDeleteItem(barcode, loadItems, showToast);
  };

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      backgroundColor: '#f5f5dc',
      color: '#333',
      minHeight: '100vh',
      padding: '40px 20px',
      margin: 0
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        
        <Header 
          handleExport={handleExport}
          setShowSettings={setShowSettings}
        />
        
        <InputSection 
          inputRef={inputRef}
          itemId={itemId}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
        />

        <InventoryTable checkedOutItems={checkedOutItems} />
      </div>

      <AdminSettingsModal 
        showSettings={showSettings}
        isAdminUnlocked={isAdminUnlocked}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        setShowSettings={setShowSettings}
        setIsAdminUnlocked={setIsAdminUnlocked}
        handleAdminLogin={handleAdminLogin}
        departmentMappings={departmentMappings}
        newPrefix={newPrefix}
        setNewPrefix={setNewPrefix}
        newDepartment={newDepartment}
        setNewDepartment={setNewDepartment}
        handleAddDepartmentMapping={handleAddDepartmentMapping}
        handleExport={handleExport}
        handleClearLogs={handleClearLogs}
        handleCsvImport={handleCsvImport}
        setShowBarcodeGenerator={setShowBarcodeGenerator}
        setShowItemManagement={setShowItemManagement}
        checkedOutItems={checkedOutItems}
        recentLogs={recentLogs}
        allItems={allItems}
      />

      <BarcodeGeneratorModal 
        showBarcodeGenerator={showBarcodeGenerator}
        setShowBarcodeGenerator={setShowBarcodeGenerator}
      />

      <ItemManagementModal 
        showItemManagement={showItemManagement}
        setShowItemManagement={setShowItemManagement}
        newItemBarcode={newItemBarcode}
        setNewItemBarcode={setNewItemBarcode}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        handleAddItem={handleAddItem}
        handleCsvUpload={handleCsvUpload}
        allItems={allItems}
        handleDeleteItem={handleDeleteItem}
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default MainInventoryApp;
