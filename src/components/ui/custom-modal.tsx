import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'alert',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      <AlertDialog open={modalState.isOpen} onOpenChange={(open) => {
        if (!open) {
          setModalState(prev => ({ ...prev, isOpen: false }));
          if (modalState.type === 'confirm' && modalState.onCancel) {
            modalState.onCancel();
          }
        }
      }}>
        <AlertDialogContent className="bg-gray-900/95 backdrop-blur-xl border border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{modalState.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {modalState.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {modalState.type === 'confirm' && (
              <AlertDialogCancel 
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                onClick={modalState.onCancel}
              >
                Avbryt
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={modalState.onConfirm}
            >
              {modalState.type === 'confirm' ? 'Bekräfta' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModalContext.Provider>
  );
};
