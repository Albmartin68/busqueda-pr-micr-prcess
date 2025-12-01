
import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { HistoryItem } from '../types';
import { XIcon } from './icons/XIcon';
import { FolderIcon } from './icons/FolderIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { GearIcon } from './icons/GearIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface GlobalHistoryModalProps {
    onClose: () => void;
}

const ToolIcon = ({ tool }: { tool: string }) => {
    switch(tool) {
        case 'Editor_Plus': return <EditorPlusIcon className="w-5 h-5 text-purple-400"/>;
        case 'Mesa_de_Trabajo': return <WorkbenchIcon className="w-5 h-5 text-sky-400"/>;
        case 'Generador_Tecnico': return <GearIcon className="w-5 h-5 text-emerald-400"/>;
        default: return <FolderIcon className="w-5 h-5 text-gray-400"/>;
    }
};

const GlobalHistoryModal: React.FC<GlobalHistoryModalProps> = ({ onClose }) => {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'Editor_Plus' | 'Mesa_de_Trabajo' | 'Generador_Tecnico'>('all');

    const loadHistory = () => {
        setItems(historyService.getItems());
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const filteredItems = activeTab === 'all' ? items : items.filter(i => i.tool === activeTab);

    const handleDownloadAll = () => {
        historyService.downloadHistoryAsZip();
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100]" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden m-4" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <FolderIcon className="w-6 h-6 text-amber-400" />
                        Historial de Archivos Generados
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex border-b border-slate-700 bg-slate-800/50">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'all' ? 'border-amber-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Todos</button>
                    <button onClick={() => setActiveTab('Editor_Plus')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Editor_Plus' ? 'border-purple-400 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Editor Plus</button>
                    <button onClick={() => setActiveTab('Mesa_de_Trabajo')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Mesa_de_Trabajo' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Mesa Trabajo</button>
                    <button onClick={() => setActiveTab('Generador_Tecnico')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Generador_Tecnico' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Generador</button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-slate-900/50">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <FolderIcon className="w-16 h-16 mb-4 opacity-20"/>
                            <p>No hay archivos en el historial para esta categoría.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 transition-colors flex flex-col gap-2 group relative">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <ToolIcon tool={item.tool} />
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-200 truncate max-w-[200px]" title={item.filename}>{item.filename}</h4>
                                                <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded text-gray-400 border border-slate-700">{item.subCategory}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-slate-900/50 p-2 rounded h-16 overflow-hidden relative">
                                        {item.content.slice(0, 150)}...
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center flex-shrink-0">
                    <button onClick={loadHistory} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <RefreshIcon className="w-4 h-4"/> Actualizar Lista
                    </button>
                    <div className="flex gap-3">
                         <button onClick={() => {if(confirm('¿Borrar historial local?')) { historyService.clearHistory(); loadHistory(); }}} className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:underline">
                            Limpiar Historial
                        </button>
                        <button onClick={handleDownloadAll} className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg shadow-amber-900/20 transition-all">
                            <DownloadIcon className="w-5 h-5"/>
                            Descargar Carpeta de Historial (ZIP)
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default GlobalHistoryModal;
