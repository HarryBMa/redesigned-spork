import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ScanLog, DepartmentMapping, Item } from '../types';

export const useDataManagement = () => {
  const [checkedOutItems, setCheckedOutItems] = useState<ScanLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  const [departmentMappings, setDepartmentMappings] = useState<DepartmentMapping[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);

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
      // Fallback to local state if Tauri backend not available
    }
  };

  /**
   * Load all items from database
   */
  const loadItems = async () => {
    try {
      const items = await invoke<Item[]>('get_all_items');
      setAllItems(items);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  /**
   * Export checked out items
   */
  const handleExport = async (showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    try {
      const filePath = await invoke<string>('quick_export_checked_out');
      showToast(`Export successful! File saved to: ${filePath}`, 'success');
    } catch (error) {
      console.error('Error exporting items:', error);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  /**
   * Clear all logs
   */
  const handleClearLogs = async (showToast: (message: string, type: 'success' | 'warning' | 'error') => void) => {
    try {
      await invoke('clear_all_logs');
      loadData();
      showToast('All logs cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing logs:', error);
      showToast('Failed to clear logs', 'error');
    }
  };

  return {
    checkedOutItems,
    setCheckedOutItems,
    recentLogs,
    setRecentLogs,
    departmentMappings,
    setDepartmentMappings,
    allItems,
    setAllItems,
    loadData,
    loadItems,
    handleExport,
    handleClearLogs
  };
};
