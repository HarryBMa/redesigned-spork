import { useState } from 'react';
import { Toast } from '../types';

export const useToast = () => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'success',
    show: false
  });

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return {
    toast,
    showToast
  };
};
