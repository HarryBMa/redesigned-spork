// Type definitions for the inventory application

export interface Article {
  id: string;
  timestamp: Date;
}

export interface ScanLog {
  id: number;
  timestamp: string;
  barcode: string;
  action: string;
  department?: string;
  item_name?: string; // Display name for the item
}

export interface DepartmentMapping {
  prefix: string;
  department: string;
}

export interface Toast {
  message: string;
  type: 'success' | 'warning' | 'error';
  show: boolean;
}
