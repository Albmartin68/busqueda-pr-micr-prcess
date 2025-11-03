import React, { useState } from 'react';
import { NotebookIcon } from '../icons/NotebookIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { WorkbenchService } from '../../services/workbenchService';

interface NotebookPanelProps {
    content: string;
    setContent: (content: string) => void;
}

export const NotebookPanel: React.FC<NotebookPanelProps> = ({ content, setContent }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [exportFormat, setExportFormat] = useState<'txt' | 'md' | 'docx' | 'pdf'>('md');

    const handleCopy = () => {
        if (!content) return;
        navigator.clipboard.writeText(content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExport = () => {
        if (!content) return;
        WorkbenchService.exportNotebook(content, exportFormat);
    };
    
    return (
        <>
            <header className="p-3 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><NotebookIcon className="w-5 h-5"/> Cuaderno de Trabajo</h3>
            </header>
            <div className="flex-grow overflow-hidden p-1">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full bg-slate-800/50 border border-slate-700/50 rounded-md p-3 text-gray-300 placeholder-gray-500 focus:outline-none font-serif leading-relaxed resize-none text-sm"
                    placeholder="Haz doble-click o usa el botón '+' en una flashcard para agregarla aquí..."
                />
            </div>
            <footer className="p-2 border-t border-slate-700 flex justify-end items-center gap-2 flex-shrink-0">
                <button onClick={handleCopy} disabled={!content} className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {isCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>} Copiar
                </button>
                <div className="flex items-center rounded-md bg-sky-700">
                    <button onClick={handleExport} disabled={!content} className="flex items-center gap-2 pl-3 pr-2 py-1 text-xs hover:bg-sky-600 rounded-l-md">
                        <DownloadIcon className="w-4 h-4"/> Exportar como
                    </button>
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="bg-sky-700 hover:bg-sky-600 text-xs pl-1 pr-2 py-[5px] rounded-r-md border-l border-sky-600/50 focus:outline-none"
                    >
                        <option value="md">Markdown</option>
                        <option value="txt">Texto Plano</option>
                        <option value="docx" disabled>Word (.docx)</option>
                        <option value="pdf" disabled>PDF</option>
                    </select>
                </div>
            </footer>
        </>
    );
};
