import React, { useState, useEffect } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface TemplateGeneratorModalProps {
  onClose: () => void;
  onSearch: (prompt: string) => void;
}

const TemplateGeneratorModal: React.FC<TemplateGeneratorModalProps> = ({ onClose, onSearch }) => {
  const [content, setContent] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

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

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };
  
  const handleNewQuery = () => {
    setContent('');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FilePlusIcon className="w-6 h-6 text-sky-400" />
            Introduce tu Prompt de Búsqueda Especializada
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close generator">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[50vh] bg-slate-800 border border-slate-700 rounded-md p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm leading-relaxed resize-none"
            placeholder="Escribe tu prompt de búsqueda avanzada aquí. Puedes detallar el tema, la jurisdicción, el formato de respuesta deseado, etc."
          />
        </div>

        <footer className="flex items-center justify-between p-4 border-t border-slate-800 flex-shrink-0 bg-slate-900/50 gap-4">
          <button
            onClick={handleNewQuery}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-slate-700 hover:bg-slate-600 text-gray-200"
          >
            <RefreshIcon className="w-5 h-5"/>
            Nueva Consulta
          </button>
          <div className="flex items-center gap-4">
            <button
                onClick={handleCopy}
                disabled={!content}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 w-36 justify-center ${
                isCopied
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
                {isCopied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                {isCopied ? '¡Copiado!' : 'Copiar Prompt'}
            </button>
            <button
                onClick={() => onSearch(content)}
                disabled={!content.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-sky-600 hover:bg-sky-500 text-white w-36 justify-center disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
                <SearchIcon className="w-5 h-5"/>
                Buscar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TemplateGeneratorModal;