import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { X, Minus, Square } from 'lucide-react';

interface WindowFrameProps {
  title?: string;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  showMaximizeButton?: boolean;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ 
  title = "Harry's Lilla Lager", 
  showCloseButton = true,
  showMinimizeButton = true,
  showMaximizeButton = true
}) => {
  // Debug: Check if transparency is working
  React.useEffect(() => {
    console.log('WindowFrame mounted, checking transparency...');
  }, []);

  const handleClose = async () => {
    try {
      // First try the new Tauri command
      await invoke('close_window', { label: 'main' });
    } catch (error) {
      console.error('Error with close_window command:', error);
      // Fallback to direct window API
      try {
        const window = getCurrentWindow();
        await window.close();
      } catch (fallbackError) {
        console.error('Error closing window with fallback:', fallbackError);
      }
    }
  };

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error('Error toggling maximize:', error);
    }
  };

  return (
    <div 
      className="h-8 bg-white/6 backdrop-blur-lg border-b border-white/25 flex items-center justify-between px-4 select-none shadow-lg"
      data-tauri-drag-region
    >
      <span className="text-white/80 font-medium text-sm">{title}</span>
      
      <div className="flex">
        {showMinimizeButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="inline-flex justify-center items-center w-8 h-8 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}
        
        {showMaximizeButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
            className="inline-flex justify-center items-center w-8 h-8 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
          >
            <Square className="w-3 h-3" />
          </button>
        )}
        
        {showCloseButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="inline-flex justify-center items-center w-8 h-8 hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WindowFrame;
