import React, { useState, useMemo, useEffect } from 'react';
import { WorkbenchFlashcard } from '../../types';
import { EyeIcon } from '../icons/EyeIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { SearchIcon } from '../icons/SearchIcon';

interface ResultsPanelProps {
    flashcards: WorkbenchFlashcard[];
    onFlashcardClick: (card: WorkbenchFlashcard) => void;
    onAddToNotebook: (card: WorkbenchFlashcard) => void;
    onRefineSearch: (newQuery: string) => void;
    initialQuery: string;
}

const FLASHCARDS_PER_PAGE = 5;

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ flashcards, onFlashcardClick, onAddToNotebook, onRefineSearch, initialQuery }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [internalQuery, setInternalQuery] = useState(initialQuery);
    const totalPages = Math.ceil(flashcards.length / FLASHCARDS_PER_PAGE);

    useEffect(() => {
        setInternalQuery(initialQuery);
    }, [initialQuery]);

    const paginatedFlashcards = useMemo(() => {
        const start = (currentPage - 1) * FLASHCARDS_PER_PAGE;
        const end = start + FLASHCARDS_PER_PAGE;
        return flashcards.slice(start, end);
    }, [flashcards, currentPage]);
    
    // Reset to page 1 if flashcards change
    useEffect(() => {
        setCurrentPage(1);
    }, [flashcards]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onRefineSearch(internalQuery);
        }
    };
    
    return (
        <>
            <header className="p-3 border-b border-slate-700 flex-shrink-0 space-y-3">
                <h3 className="font-bold text-white">Flashcards de Resultados ({flashcards.length})</h3>
                <div className="relative">
                    <input
                        type="text"
                        value={internalQuery}
                        onChange={(e) => setInternalQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Reformular pregunta..."
                        className="w-full bg-slate-700/80 border border-slate-600/80 rounded-md py-1.5 pl-3 pr-20 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                        onClick={() => onRefineSearch(internalQuery)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded text-xs"
                    >
                        <SearchIcon className="w-3 h-3 mr-1.5"/>
                        Buscar
                    </button>
                </div>
            </header>
            <div className="overflow-y-auto p-3 space-y-3 flex-grow">
                {paginatedFlashcards.length > 0 ? paginatedFlashcards.map(card => (
                    <div key={card.id} onClick={() => onFlashcardClick(card)} onDoubleClick={() => onAddToNotebook(card)} className="bg-slate-800/70 p-3 rounded-lg shadow-md hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-sky-400">{card.sourceDocument.country}</span>
                                <span className="text-gray-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{card.sourceDocument.language.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); onFlashcardClick(card); }} className="p-1.5 rounded-md hover:bg-slate-700" title="Ver documento fuente">
                                    <EyeIcon className="w-4 h-4 text-gray-400"/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onAddToNotebook(card); }} className="p-1.5 rounded-md hover:bg-slate-700" title="Agregar al cuaderno">
                                    <PlusCircleIcon className="w-4 h-4 text-gray-400"/>
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{card.citation}</p>
                        <p className="text-xs text-gray-500 italic truncate" title={card.sourceDocument.filename}>Fuente: {card.sourceDocument.filename} (p. {card.pageNumber})</p>
                    </div>
                )) : (
                    <div className="text-center text-gray-400 p-4">No se encontraron resultados relevantes en los documentos proporcionados.</div>
                )}
            </div>
            {totalPages > 1 && (
                <footer className="p-2 border-t border-sky-800 bg-sky-900 flex justify-between items-center flex-shrink-0">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Anterior</button>
                    <span className="text-sm text-sky-200">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Siguiente</button>
                </footer>
            )}
        </>
    );
};