import React, { useEffect } from 'react';
import { FilterIcon } from './icons/FilterIcon';

interface SettingsModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FilterIcon className="w-5 h-5 text-sky-400"/>
                Ajustes de Búsqueda
            </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-4"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto bg-slate-800/50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;