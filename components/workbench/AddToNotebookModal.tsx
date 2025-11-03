
import React from 'react';
import { WorkbenchFlashcard } from '../../types';
import { XIcon } from '../icons/XIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';

interface AddToNotebookModalProps {
  card: WorkbenchFlashcard;
  onClose: () => void;
  onConfirm: (formattedText: string) => void;
}

const AddToNotebookModal: React.FC<AddToNotebookModalProps> = ({ card, onClose, onConfirm }) => {
  const handleConfirm = (type: 'summary' | 'full' | 'verbatim') => {
    let text;
    switch (type) {
      case 'summary':
        text = card.citation;
        break;
      case 'full':
        text = card.originalText;
        break;
      case 'verbatim':
        const regex = new RegExp(`(${card.queryMatch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        text = card.originalText.replace(regex, `**$1**`);
        break;
      default:
        text = card.citation;
    }

    const citationText = `> ${text.replace(/\n/g, '\n> ')}\n>\n> **Fuente**: ${card.sourceDocument.filename} | **Página**: ${card.pageNumber} | **País**: ${card.sourceDocument.country}\n---\n\n`;
    onConfirm(citationText);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Agregar al Cuaderno de Trabajo</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6">
          <p className="text-gray-400 mb-2 text-sm">Cita seleccionada:</p>
          <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700 max-h-24 overflow-y-auto">
            <p className="text-sm text-gray-300 italic">"{card.citation}"</p>
          </div>
          <p className="text-gray-300 mt-6 mb-4 font-medium">¿Cómo deseas agregar esta cita?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <button
              onClick={() => handleConfirm('summary')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <SummarizeIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Resumida</span>
              <span className="text-xs text-gray-400 mt-1">Copia la cita resumida por la IA.</span>
            </button>
             <button
              onClick={() => handleConfirm('full')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <BookOpenIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Completa</span>
              <span className="text-xs text-gray-400 mt-1">Copia el párrafo original completo.</span>
            </button>
            <button
              onClick={() => handleConfirm('verbatim')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <ClipboardListIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Textual</span>
              <span className="text-xs text-gray-400 mt-1">Párrafo original con búsqueda resaltada.</span>
            </button>
          </div>
        </div>
        <footer className="p-4 border-t border-slate-700 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-gray-200">
                Cancelar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AddToNotebookModal;
