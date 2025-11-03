import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { ImportIcon } from './icons/ImportIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DocumentResult, WorkbenchFlashcard, WorkbenchSourceDocument } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { NotebookIcon } from './icons/NotebookIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
// FIX: Import ClipboardIcon to resolve reference error.
import { ClipboardIcon } from './icons/ClipboardIcon';

const FLASHCARDS_PER_PAGE = 6;
const MOCK_COUNTRIES = ['ARG', 'BRA', 'CHL', 'COL', 'MEX', 'PER', 'ESP'];

const buildDocResult = (doc: WorkbenchSourceDocument): DocumentResult => ({
  id: `workbench-${doc.id}`,
  category: 'documents',
  title: doc.filename,
  url: `internal-secure-file://${doc.filename}`,
  snippet: doc.content.slice(0, 150) + '...',
  source: 'Carpeta Segura Interna',
  type: doc.filename.split('.').pop()?.toUpperCase() as 'PDF' | 'DOCX' || 'PDF',
  language: doc.language,
  country: doc.country,
  certification: 'Validado por Workbench',
  content: doc.content,
});

const loadingSteps = [
    { message: 'Activando enjambre de engranajes...', duration: 800 },
    { message: 'Búsqueda semántica en índice FAISS...', duration: 1200 },
    { message: 'Búsqueda lexical con BM25...', duration: 1000 },
    { message: 'Fusionando y re-ranqueando resultados...', duration: 1100 },
    { message: 'Generando flashcards desde el corpus...', duration: 700 },
];

interface Props {
  onClose: () => void;
  onViewSourceDocument: (d: DocumentResult, q?: string) => void;
}

export default function WorkbenchModal({ onClose, onViewSourceDocument }: Props) {
  const [stage, setStage] = useState<'import' | 'searching' | 'results'>('import');
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [sourceDocs, setSourceDocs] = useState<WorkbenchSourceDocument[]>([]);
  const [flashcards, setFlashcards] = useState<WorkbenchFlashcard[]>([]);
  const [notebookContent, setNotebookContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
    });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.add('border-sky-500', 'bg-slate-700/50');
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.remove('border-sky-500', 'bg-slate-700/50');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.remove('border-sky-500', 'bg-slate-700/50');
    handleFileSelect(e.dataTransfer.files);
  };

  const handleReset = useCallback(() => {
    setStage('import');
    setFiles([]);
    setSearchQuery('');
    setFlashcards([]);
    setNotebookContent('');
    setCurrentPage(1);
    setSourceDocs([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || files.length === 0) return;

    setIsLoading(true);
    setStage('searching');
    
    // Mock document processing
    const docs: WorkbenchSourceDocument[] = files.map((file, i) => ({
      id: `doc-${i}`,
      filename: file.name,
      content: `Este es un documento sobre regulaciones de tráfico en ${MOCK_COUNTRIES[i % MOCK_COUNTRIES.length]}. La sanción por exceso de velocidad superior en 50 km/h es una multa severa y la posible suspensión de la licencia. La adopción internacional de estas normas es crucial para la seguridad vial.`,
      language: 'es',
      country: MOCK_COUNTRIES[i % MOCK_COUNTRIES.length],
    }));
    setSourceDocs(docs);

    // Simulate backend processing
    let delay = 0;
    for(const step of loadingSteps) {
        setTimeout(() => setLoadingMessage(step.message), delay);
        delay += step.duration;
    }

    // Generate mock flashcards after simulation
    setTimeout(() => {
        const queryTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 3);
        const queryMatch = queryTerms[0] || 'sanción';
        const newFlashcards: WorkbenchFlashcard[] = [];
        docs.forEach(doc => {
            for (let i = 0; i < Math.ceil(Math.random() * 3) + 1; i++) {
                newFlashcards.push({
                    id: `flash-${doc.id}-${i}`,
                    sourceDocument: doc,
                    pageNumber: Math.ceil(Math.random() * 20) + 1,
                    citation: `... en ${doc.country}, la ${queryMatch} por exceso de velocidad en vías urbanas es de ${Math.round(Math.random() * 500) + 100} USD y puede incluir la retención del vehículo...`,
                    queryMatch: queryMatch,
                    score: Math.random() * 0.15 + 0.85,
                });
            }
        });
        setFlashcards(newFlashcards.sort((a,b) => b.score - a.score));
        setIsLoading(false);
        setStage('results');
    }, delay);
  }, [searchQuery, files]);

  const handleAddToNotebook = useCallback((card: WorkbenchFlashcard) => {
    const citationText = `> ${card.citation.replace(/\n/g, '\n> ')}\n>\n> **Fuente**: ${card.sourceDocument.filename} | **Página**: ${card.pageNumber} | **País**: ${card.sourceDocument.country}\n---\n\n`;
    setNotebookContent(prev => prev + citationText);
  }, []);
  
  const handleViewSource = useCallback((card: WorkbenchFlashcard) => {
    onViewSourceDocument(buildDocResult(card.sourceDocument), card.queryMatch);
  }, [onViewSourceDocument]);

  const handleCopyNotebook = () => {
    navigator.clipboard.writeText(notebookContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const totalPages = Math.ceil(flashcards.length / FLASHCARDS_PER_PAGE);
  const paginatedFlashcards = useMemo(() => {
    return flashcards.slice((currentPage - 1) * FLASHCARDS_PER_PAGE, currentPage * FLASHCARDS_PER_PAGE);
  }, [flashcards, currentPage]);

  const renderImportScreen = () => (
    <div className="flex flex-col gap-6 p-6 h-full">
        <div 
            ref={dropzoneRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className="flex-shrink-0 p-6 border-2 border-dashed border-slate-600 rounded-lg text-center transition-colors duration-300"
        >
            <p className="text-gray-400">Arrastra y suelta documentos aquí o</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-sky-400 font-semibold hover:underline mt-1">
                selecciona archivos
            </button>
            <p className="text-xs text-gray-500 mt-2">PDF, DOCX, XLSX, etc.</p>
        </div>
        
        {files.length > 0 && (
            <div className="flex-shrink-0 bg-slate-800/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                 <ul className="space-y-1 list-disc list-inside text-gray-300">
                    {files.map((f) => (
                    <li key={f.name} className="text-sm truncate">
                        {f.name}{' '}
                        <span className="text-xs text-gray-500">- {(f.size / 1024).toFixed(1)} KB</span>
                    </li>
                    ))}
                </ul>
            </div>
        )}

        <div className="flex-grow flex flex-col">
            <label htmlFor="workbench-query" className="text-lg font-semibold mb-2 text-gray-200">
                Describe el hecho que quieres comparar:
            </label>
            <textarea
                id="workbench-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full flex-grow bg-slate-800 border border-slate-700 rounded-md p-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-base leading-relaxed resize-none"
                placeholder='Ej: "¿Qué sanciones hay por exceso de velocidad superior en 50 km/h en vías urbanas, especialmente en Latinoamérica?"'
            />
        </div>
    </div>
  );

  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <SpinnerIcon className="w-12 h-12 text-sky-400" />
        <p className="mt-4 text-lg font-semibold text-gray-300">{loadingMessage}</p>
        <p className="text-sm text-gray-500">Procesando documentos en la Carpeta Segura...</p>
    </div>
  );

  const renderResultsScreen = () => (
    <div className="flex-grow flex overflow-hidden">
        {/* Flashcards Panel */}
        <div className="w-1/2 flex flex-col border-r border-slate-800">
            <header className="p-3 border-b border-slate-800 flex-shrink-0">
                <h3 className="font-bold text-white">Flashcards de Resultados ({flashcards.length})</h3>
            </header>
            <div className="overflow-y-auto p-3 space-y-3 flex-grow">
                {paginatedFlashcards.map(card => (
                    <div key={card.id} onDoubleClick={() => handleAddToNotebook(card)} className="bg-slate-800/70 p-3 rounded-lg shadow-md hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-sky-400">{card.sourceDocument.country}</span>
                                <span className="text-gray-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{card.sourceDocument.language.toUpperCase()}</span>
                                <span className="text-amber-400 font-mono">Score: {card.score.toFixed(3)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleViewSource(card)} className="p-1.5 rounded-md hover:bg-slate-700"><EyeIcon className="w-4 h-4 text-gray-400"/></button>
                                <button onClick={() => handleAddToNotebook(card)} className="p-1.5 rounded-md hover:bg-slate-700"><PlusCircleIcon className="w-4 h-4 text-gray-400"/></button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{card.citation}</p>
                        <p className="text-xs text-gray-500 italic truncate">Fuente: {card.sourceDocument.filename} (p. {card.pageNumber})</p>
                    </div>
                ))}
            </div>
            {totalPages > 1 && (
                <footer className="p-2 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Anterior</button>
                    <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">Siguiente</button>
                </footer>
            )}
        </div>
        {/* Notebook Panel */}
        <div className="w-1/2 flex flex-col">
            <header className="p-3 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2"><NotebookIcon className="w-5 h-5"/> Cuaderno de Trabajo</h3>
                <div className="flex items-center gap-2">
                     <button onClick={handleCopyNotebook} className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md ${isCopied ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}>{isCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>} Copiar</button>
                     <button className="flex items-center gap-2 px-3 py-1 text-xs rounded-md bg-sky-700 hover:bg-sky-600"><DownloadIcon className="w-4 h-4"/> Exportar</button>
                </div>
            </header>
            <div className="flex-grow overflow-hidden p-1 bg-slate-900">
                <textarea
                    readOnly
                    value={notebookContent}
                    className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-md p-3 text-gray-300 placeholder-gray-500 focus:outline-none font-serif leading-relaxed resize-none text-sm"
                    placeholder="Haz doble-click en una flashcard para agregarla aquí..."
                />
            </div>
        </div>
    </div>
  );
  
  const renderContent = () => {
    if (isLoading || stage === 'searching') return renderLoadingScreen();
    if (stage === 'results') return renderResultsScreen();
    return renderImportScreen();
  }

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

        <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />

        <div className="flex-grow flex flex-col overflow-hidden">
            {renderContent()}
        </div>
        
        <footer className="flex items-center justify-between p-3 border-t border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-white"><ImportIcon className="w-5 h-5" /> Importar más</button>
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-gray-200"><RefreshIcon className="w-5 h-5" /> Reiniciar</button>
            </div>
            {stage === 'import' && (
                <button onClick={handleSearch} disabled={files.length === 0 || !searchQuery.trim()} className="flex items-center gap-2 px-8 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white disabled:bg-slate-500 disabled:cursor-not-allowed">
                    <SearchIcon className="w-5 h-5"/>
                    Buscar en Carpeta Segura
                </button>
            )}
        </footer>
      </div>
    </div>
  );
}
