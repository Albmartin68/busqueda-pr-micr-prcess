
import React, { useState, useEffect, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { WorkbenchFlashcard, WorkbenchSourceDocument } from '../types';
import { DropScreen } from './workbench/DropScreen';
import { ResultsPanel } from './workbench/ResultsPanel';
import { ViewerPanel } from './workbench/ViewerPanel';
import { NotebookPanel } from './workbench/NotebookPanel';
import { WorkbenchService } from '../services/workbenchService';
import { historyService } from '../services/historyService';
import { Column } from './workbench/Column';
import AddToNotebookModal from './workbench/AddToNotebookModal';

interface Props {
  onClose: () => void;
}

type Stage = 'import' | 'searching' | 'results';

export default function WorkbenchModal({ onClose }: Props) {
  const [stage, setStage] = useState<Stage>('import');
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [sourceDocs, setSourceDocs] = useState<WorkbenchSourceDocument[]>([]);
  const [flashcards, setFlashcards] = useState<WorkbenchFlashcard[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<WorkbenchSourceDocument | null>(null);
  const [notebookContent, setNotebookContent] = useState('');
  const [highlightedParagraphId, setHighlightedParagraphId] = useState<string | null>(null);
  const [cardForNotebook, setCardForNotebook] = useState<WorkbenchFlashcard | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleReset = useCallback(() => {
    setStage('import');
    setFiles([]);
    setSearchQuery('');
    setFlashcards([]);
    setNotebookContent('');
    setSelectedDoc(null);
    setSourceDocs([]);
    setHighlightedParagraphId(null);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || files.length === 0) return;

    setSearchQuery(query);
    setStage('searching');
    setLoadingMessage('Iniciando proceso...');
    
    try {
      const results = await WorkbenchService.search(files, query, setLoadingMessage);
      
      setSourceDocs(results.sourceDocs);
      setFlashcards(results.flashcards);
      setSelectedDoc(results.sourceDocs[0] || null);
      setStage('results');
    } catch (e) {
      console.error("Workbench search failed:", e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      alert(`Error en la Mesa de Trabajo: ${errorMessage}`);
      setStage('import'); // Go back to import screen on error
    }
  }, [files]);

  const handleRefineSearch = useCallback(async (newQuery: string) => {
    if (!newQuery.trim() || sourceDocs.length === 0) return;

    setSearchQuery(newQuery);
    setStage('searching');
    setLoadingMessage('Refinando búsqueda...');
    try {
        const newFlashcards = await WorkbenchService.refineSearch(sourceDocs, newQuery, setLoadingMessage);
        setFlashcards(newFlashcards);
    } catch (e) {
        console.error("Workbench refine search failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        alert(`Error al refinar la búsqueda: ${errorMessage}`);
    } finally {
        setStage('results');
    }
  }, [sourceDocs]);

  const handleFlashcardClick = useCallback((card: WorkbenchFlashcard) => {
    setSelectedDoc(card.sourceDocument);
    setHighlightedParagraphId(card.paragraphId);
    // Remove highlight after a delay to allow re-triggering
    setTimeout(() => setHighlightedParagraphId(null), 10);
  }, []);

  const handleAddToNotebook = useCallback((card: WorkbenchFlashcard) => {
    setCardForNotebook(card);
  }, []);
  
  const handleConfirmAddToNotebook = useCallback((formattedText: string) => {
    setNotebookContent(prev => prev + formattedText);
    setCardForNotebook(null); // Close the modal
  }, []);

  // Hook into notebook changes or specific "Save" actions if needed, 
  // but for now, we save to history when exporting (handled inside NotebookPanel indirectly via WorkbenchService or we can add a save button)
  // Let's modify exportNotebook in WorkbenchService to also return content so we can save it here, or just intercept.
  
  // NOTE: NotebookPanel handles export via WorkbenchService.exportNotebook. 
  // We should update WorkbenchService to use historyService, or pass a handler. 
  // For simplicity, we'll assume NotebookPanel calls a function that we pass down.
  // ... Wait, NotebookPanel calls WorkbenchService.exportNotebook directly.
  // I will update NotebookPanel props to accept onExport.

  const renderContent = () => {
    switch (stage) {
      case 'searching':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <SpinnerIcon className="w-12 h-12 text-sky-400" />
            <p className="mt-4 text-lg font-semibold text-gray-300">{loadingMessage}</p>
            <p className="text-sm text-gray-500">Procesando documentos en la Carpeta Segura...</p>
          </div>
        );
      case 'results':
        return (
            <div className="flex-grow flex overflow-hidden p-3 gap-3">
                <Column width="35%">
                    <ResultsPanel
                        flashcards={flashcards}
                        onFlashcardClick={handleFlashcardClick}
                        onAddToNotebook={handleAddToNotebook}
                        onRefineSearch={handleRefineSearch}
                        initialQuery={searchQuery}
                    />
                </Column>
                <Column width="40%">
                    <ViewerPanel document={selectedDoc} searchQuery={searchQuery} highlightedParagraphId={highlightedParagraphId} />
                </Column>
                <Column width="25%">
                    <NotebookPanel 
                        content={notebookContent} 
                        setContent={setNotebookContent}
                        onExport={(content, format) => {
                            WorkbenchService.exportNotebook(content, format);
                            // Save to History
                            historyService.addItem('Mesa_de_Trabajo', 'Cuaderno', 'notas_investigacion', content);
                        }}
                    />
                </Column>
            </div>
        );
      case 'import':
      default:
        return (
            <DropScreen 
                files={files} 
                setFiles={setFiles} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
            />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <WorkbenchIcon className="w-6 h-6 text-sky-400" />
            Mesa de Trabajo
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
        </header>

        <div className="flex-grow flex flex-col overflow-hidden">
            {renderContent()}
        </div>
        
        <footer className="flex items-center justify-between p-3 border-t border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-gray-200">
                    <RefreshIcon className="w-5 h-5" /> Reiniciar
                </button>
            </div>
            {stage === 'import' && (
                <button onClick={() => handleSearch(searchQuery)} disabled={files.length === 0 || !searchQuery.trim()} className="flex items-center gap-2 px-8 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white disabled:bg-slate-500 disabled:cursor-not-allowed">
                    <SearchIcon className="w-5 h-5"/>
                    Buscar en Carpeta Segura
                </button>
            )}
        </footer>
      </div>

      {cardForNotebook && (
        <AddToNotebookModal 
          card={cardForNotebook}
          onClose={() => setCardForNotebook(null)}
          onConfirm={handleConfirmAddToNotebook}
        />
      )}
    </div>
  );
}
