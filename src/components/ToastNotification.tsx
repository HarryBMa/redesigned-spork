import React from 'react';
import { Toast } from '../types';

interface ToastNotificationProps {
  toast: Toast;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 25px',
      border: '2px solid #000',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: 1000,
      opacity: toast.show ? 1 : 0,
      transform: toast.show ? 'translateX(0)' : 'translateX(100%)',
      transition: 'all 0.3s ease',
      backgroundColor: 
        toast.type === 'success' ? '#4ade80' :
        toast.type === 'warning' ? '#fbbf24' : '#ef4444',
      color: toast.type === 'error' ? '#fff' : '#000'
    }}>
      {toast.message}
    </div>
  );
};

export default ToastNotification;
