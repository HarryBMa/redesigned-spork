import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useAdminLogic = () => {
  // Settings and admin state
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  // Item management state
  const [showItemManagement, setShowItemManagement] = useState(false);
  const [newItemBarcode, setNewItemBarcode] = useState('');
  const [newItemName, setNewItemName] = useState('');

  /**
   * Admin login handler
   */
  const handleAdminLogin = async (showToast: (message: string, type: 'success' | 'warning' | 'error') => void, loadItems: () => void) => {
    if (adminPassword === 'demoHH') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
      // Load items when admin unlocks
      await loadItems();
    } else {
      showToast('Incorrect password. Please try again.', 'error');
      setAdminPassword('');
    }
  };

  /**
   * Add department mapping
   */
  const handleAddDepartmentMapping = async (loadData: () => void, showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    if (!newPrefix.trim() || !newDepartment.trim()) return;
    
    try {
      await invoke('set_department_mapping', { 
        prefix: newPrefix.toUpperCase(), 
        department: newDepartment 
      });
      setNewPrefix('');
      setNewDepartment('');
      loadData();
      showToast('Department mapping added successfully', 'success');
    } catch (error) {
      console.error('Error adding department mapping:', error);
      showToast('Failed to add department mapping', 'error');
    }
  };

  /**
   * Add a single item manually
   */
  const handleAddItem = async (loadItems: () => void, showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    if (!newItemBarcode.trim() || !newItemName.trim()) {
      showToast('Both barcode and name are required', 'error');
      return;
    }
    
    try {
      await invoke('add_item', { 
        barcode: newItemBarcode.toUpperCase().trim(), 
        name: newItemName.trim() 
      });
      setNewItemBarcode('');
      setNewItemName('');
      await loadItems();
      showToast('Item added successfully', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Failed to add item', 'error');
    }
  };

  /**
   * Handle CSV file upload for bulk item import
   */
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>, loadItems: () => void, showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    try {
      // For web, we'll read the file content and parse it manually
      const text = await file.text();
      const lines = text.split('\n');
      let importCount = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue; // Skip empty lines and comments
        
        const parts = trimmedLine.split(',');
        if (parts.length >= 2) {
          const barcode = parts[0].trim().replace(/"/g, ''); // Remove quotes
          const name = parts[1].trim().replace(/"/g, '');
          
          if (barcode && name) {
            try {
              await invoke('add_item', { barcode: barcode.toUpperCase(), name });
              importCount++;
            } catch (error) {
              console.warn(`Failed to import item ${barcode}: ${error}`);
            }
          }
        }
      }

      await loadItems();
      showToast(`Successfully imported ${importCount} items`, 'success');
    } catch (error) {
      console.error('Error processing CSV file:', error);
      showToast('Failed to process CSV file', 'error');
    }

    // Reset file input
    event.target.value = '';
  };

  /**
   * Delete an item
   */
  const handleDeleteItem = async (barcode: string, loadItems: () => void, showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    if (!confirm(`Are you sure you want to delete item ${barcode}?`)) return;
    
    try {
      await invoke('delete_item', { barcode });
      await loadItems();
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Failed to delete item', 'error');
    }
  };

  return {
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
    handleAdminLogin,
    handleAddDepartmentMapping,
    handleAddItem,
    handleCsvUpload,
    handleDeleteItem
  };
};
