import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DocumentResult, FlashcardItem } from '../types';
import { translateDocumentContent, summarizeContent } from '../services/geminiService';
import { ARGOS_LANGUAGES } from '../constants';

import { SpinnerIcon } from './icons/SpinnerIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { SwarmIcon } from './icons/SwarmIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SearchIcon } from './icons/SearchIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';
import { SummarizeIcon } from './icons/SummarizeIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';

interface DocumentViewerModalProps {
  document: DocumentResult;
  onClose: () => void;
  initialSearchQuery?: string;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose, initialSearchQuery = '' }) => {
  // Main state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'complete' | 'summary'>('complete');
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  // Translation state
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslationLoading, setIsLoadingTranslation] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>(ARGOS_LANGUAGES[0].value);

  // Internal search state
  const [internalSearchQuery, setInternalSearchQuery] = useState(initialSearchQuery);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [activeFlashcardId, setActiveFlashcardId] = useState<string | null>(null);
  const initialSearchPerformed = useRef(false);

  // Panel visibility state
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);

  // Selection & Export state
  const [selectedFlashcards, setSelectedFlashcards] = useState<Record<string, FlashcardItem>>({});
  const [isSelectionCopied, setIsSelectionCopied] = useState<boolean>(false);

  const contentToDisplay = useMemo(() => {
    const baseContent = viewMode === 'summary' ? summary : document.content;
    return translatedContent ?? baseContent ?? '';
  }, [viewMode, summary, document.content, translatedContent]);
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFlashcards([]);
      setIsSearchPanelOpen(false);
      return;
    }
    const queryTrimmed = query.trim();
    const regex = new RegExp(queryTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    const paragraphs = contentToDisplay.split('\n\n');
    const results: FlashcardItem[] = [];

    paragraphs.forEach((p, pIndex) => {
      if (p.toLowerCase().includes(queryTrimmed.toLowerCase())) {
        const snippet = p.replace(regex, (match) => `<mark class="bg-yellow-300 text-black px-1 rounded">${match}</mark>`);
        results.push({
          id: `match-${pIndex}`,
          context: p,
          snippet,
          paragraphIndex: pIndex,
        });
      }
    });

    setFlashcards(results);
    setIsSearchPanelOpen(true);
    setActiveFlashcardId(results.length > 0 ? results[0].id : null);
  }, [contentToDisplay]);

  // Reset states when document changes
  useEffect(() => {
    setViewMode('complete');
    setSummary(null);
    setTranslatedContent(null);
    setInternalSearchQuery(initialSearchQuery);
    setFlashcards([]);
    setSelectedFlashcards({});
    setIsSearchPanelOpen(false);
    setIsExportPanelOpen(false);
    initialSearchPerformed.current = false;
  }, [document, initialSearchQuery]);

  // Auto-perform search on load if initial query exists
  useEffect(() => {
    if (initialSearchQuery && !initialSearchPerformed.current && contentToDisplay) {
      performSearch(initialSearchQuery);
      initialSearchPerformed.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery, contentToDisplay]);


  // Handlers
  const handleCopy = (text: string, setCopied: (isCopied: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleSummary = async () => {
    if (viewMode === 'complete') {
      setViewMode('summary');
      if (!summary) {
        setIsSummaryLoading(true);
        try {
          const result = await summarizeContent(document.content);
          setSummary(result);
        } catch (e) {
          console.error("Summarization failed", e);
          setSummary("Could not generate summary.");
        } finally {
          setIsSummaryLoading(false);
        }
      }
    } else {
      setViewMode('complete');
    }
    setTranslatedContent(null); // Reset translation when switching views
  };

  const handleTranslate = async (language: string) => {
    setIsLoadingTranslation(true);
    setTranslationError(null);
    const contentForTranslation = viewMode === 'summary' ? (summary || '') : document.content;
    try {
      const translatedChunks = await translateDocumentContent(contentForTranslation, language);
      setTranslatedContent(translatedChunks.join('\n\n'));
    } catch (error) {
      setTranslationError('Error al traducir. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    handleTranslate(lang);
  };

  const handleRestoreOriginal = () => {
    setTranslatedContent(null);
    setTranslationError(null);
  };

  const handleDownloadTranslation = () => {
    if (!translatedContent) return;

    // Simple filename sanitization
    const safeFilename = document.title.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
    
    const blob = new Blob([translatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.setAttribute('download', `translated_${safeFilename || 'document'}.txt`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleInternalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(internalSearchQuery);
    }
  };
  
  const handleFlashcardClick = (card: FlashcardItem) => {
    setActiveFlashcardId(card.id);
    // FIX: Use window.document to avoid conflict with the 'document' prop.
    const element = window.document.getElementById(`paragraph-${card.paragraphIndex}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleToggleFlashcardSelection = (card: FlashcardItem) => {
    const newSelection = { ...selectedFlashcards };
    if (newSelection[card.id]) {
      delete newSelection[card.id];
    } else {
      newSelection[card.id] = card;
    }
    setSelectedFlashcards(newSelection);
    if (Object.keys(newSelection).length > 0) {
      setIsExportPanelOpen(true);
    }
  };
  
  const handleDownloadSelection = (format: 'txt' | 'md') => {
    // FIX: Property 'context' does not exist on type 'unknown'. Explicitly type 'fc' as FlashcardItem.
    const content = Object.values(selectedFlashcards).map((fc: FlashcardItem) => fc.context).join('\n\n');
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    // FIX: Use window.document to avoid conflict with the 'document' prop.
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `selection.${format}`;
    // FIX: Use window.document to avoid conflict with the 'document' prop.
    window.document.body.appendChild(a);
    a.click();
    // FIX: Use window.document to avoid conflict with the 'document' prop.
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = useMemo(() => {
    const paragraphs = contentToDisplay.split('\n\n');
    const imageRegex = /!\[(.*?)\]\((.*?)\)/;
    const searchRegex = internalSearchQuery ? new RegExp(`(${internalSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi') : null;

    return paragraphs.map((p, index) => {
      const imageMatch = p.match(imageRegex);
      if (imageMatch) {
        return (
          <div key={index} id={`paragraph-${index}`} className="my-6 flex justify-center">
            <figure className="max-w-full bg-slate-800/50 rounded-lg shadow-lg border border-slate-700">
              <img src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full rounded-t-md"/>
              {imageMatch[1] && <figcaption className="p-3 text-center text-sm text-gray-400 italic">{imageMatch[1]}</figcaption>}
            </figure>
          </div>
        );
      }
      
      const parts = searchRegex ? p.split(searchRegex) : [p];

      return (
        <p key={index} id={`paragraph-${index}`} className="mb-4">
          {searchRegex ? parts.map((part, i) =>
            part.toLowerCase() === internalSearchQuery.toLowerCase() ? (
              <mark key={i} className="bg-sky-500/40 text-inherit rounded px-0.5">{part}</mark>
            ) : ( part )
          ) : p}
        </p>
      );
    });
  }, [contentToDisplay, internalSearchQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden m-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-white truncate pr-4">{document.title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => handleCopy(contentToDisplay, setIsCopied)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
              {isCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}
              {isCopied ? '¡Copiado!' : 'Copiar Texto'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5"/></button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="p-3 bg-slate-800/50 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={handleToggleSummary} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md disabled:bg-slate-500 w-36 justify-center">
              {isSummaryLoading ? <SpinnerIcon className="w-4 h-4"/> : <SummarizeIcon className="w-4 h-4"/>}
              <span>{viewMode === 'complete' ? 'Resumir' : 'Ver Completo'}</span>
            </button>
            <div className="relative">
              <select value={targetLanguage} onChange={(e) => handleLanguageChange(e.target.value)} disabled={isTranslationLoading} className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-2 pr-8 text-sm focus:ring-sky-500 focus:border-sky-500 appearance-none">
                {ARGOS_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            {translatedContent ? (
              <>
                <button onClick={handleRestoreOriginal} className="text-sm px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md">Restaurar Original</button>
                <button onClick={handleDownloadTranslation} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-md text-white">
                  <DownloadIcon className="w-4 h-4"/>
                  Descargar
                </button>
              </>
            ) : (
              <button onClick={() => handleTranslate(targetLanguage)} disabled={isTranslationLoading} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-500 w-32 justify-center">
                {isTranslationLoading ? <SpinnerIcon className="w-4 h-4"/> : <TranslateIcon className="w-4 h-4"/>}
                <span>{isTranslationLoading ? 'Traduciendo...' : 'Traducir'}</span>
              </button>
            )}
          </div>
          <div className="relative">
            <input type="text" value={internalSearchQuery} onChange={e => setInternalSearchQuery(e.target.value)} onKeyDown={handleInternalSearchKeyDown} placeholder="Buscar en documento..." className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-8 pr-4 text-sm w-64 focus:ring-sky-500"/>
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)} className={`p-2 rounded-md transition-colors ${isSearchPanelOpen ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><SearchIcon className="w-4 h-4"/></button>
            <button onClick={() => setIsExportPanelOpen(!isExportPanelOpen)} className={`p-2 rounded-md transition-colors ${isExportPanelOpen ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}><ClipboardListIcon className="w-4 h-4"/></button>
          </div>
        </div>
        {isTranslationLoading && <div className="flex items-center justify-center p-2 bg-slate-800 text-sm text-sky-400"><SwarmIcon className="w-4 h-4 mr-2"/>El enjambre de micro-procesadores está traduciendo...</div>}
        {translationError && <p className="p-2 text-center text-sm bg-red-900/50 text-red-400">{translationError}</p>}

        {/* Main Content Area */}
        <div className="flex-grow flex overflow-hidden">
          <div className="document-viewer-content p-6 md:p-8 flex-grow overflow-y-auto whitespace-pre-wrap text-gray-300 leading-relaxed font-serif text-[17px] transition-all duration-300">
            {isSummaryLoading ? <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8"/></div> : renderContent}
          </div>
          
          {/* Search "Flashcards" Panel */}
          <aside className={`flex flex-col bg-slate-800/70 backdrop-blur-sm transition-all duration-300 ease-in-out flex-shrink-0 ${isSearchPanelOpen ? 'w-1/3 border-l' : 'w-0'} border-slate-700`}>
            {isSearchPanelOpen && <>
              <header className="p-3 border-b border-slate-700 flex-shrink-0"><h3 className="font-bold text-white">Resultados de Búsqueda ({flashcards.length})</h3></header>
              <div className="overflow-y-auto p-2 space-y-2 flex-grow">
                {flashcards.length > 0 ? flashcards.map(card => (
                  <div key={card.id} onClick={() => handleFlashcardClick(card)} className={`p-3 rounded-md cursor-pointer border-2 transition-colors ${activeFlashcardId === card.id ? 'bg-sky-900/50 border-sky-600' : 'bg-slate-700/50 border-transparent hover:bg-slate-700'}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-400 mb-2" dangerouslySetInnerHTML={{ __html: card.snippet }}></p>
                      <input type="checkbox" checked={!!selectedFlashcards[card.id]} onChange={() => handleToggleFlashcardSelection(card)} onClick={e => e.stopPropagation()} className="ml-2 mt-1 accent-sky-500 flex-shrink-0"/>
                    </div>
                  </div>
                )) : <p className="p-4 text-center text-gray-400 text-sm">No se encontraron resultados para "{internalSearchQuery}".</p>}
              </div>
            </>}
          </aside>

          {/* Export Panel */}
          <aside className={`flex flex-col bg-slate-800/70 backdrop-blur-sm transition-all duration-300 ease-in-out flex-shrink-0 ${isExportPanelOpen ? 'w-1/3 border-l' : 'w-0'} border-slate-700`}>
            {isExportPanelOpen && <>
              <header className="p-3 border-b border-slate-700 flex-shrink-0"><h3 className="font-bold text-white">Selección para Exportar ({Object.keys(selectedFlashcards).length})</h3></header>
              <textarea
                readOnly
                // FIX: Property 'context' does not exist on type 'unknown'. Explicitly type 'f' as FlashcardItem.
                value={Object.values(selectedFlashcards).map((f: FlashcardItem) => f.context).join('\n\n')}
                className="flex-grow bg-slate-900 p-3 text-sm font-mono focus:outline-none resize-none w-full"
                placeholder="Seleccione fragmentos de los resultados de búsqueda para agregarlos aquí."
              />
              <footer className="p-2 border-t border-slate-700 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => {
                  // FIX: Property 'context' does not exist on type 'unknown'. Explicitly type 'f' as FlashcardItem.
                  handleCopy(Object.values(selectedFlashcards).map((f: FlashcardItem) => f.context).join('\n\n'), setIsSelectionCopied)
                }} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isSelectionCopied ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  {isSelectionCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}
                  Copiar
                </button>
                <button onClick={() => handleDownloadSelection('txt')} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-sky-700 hover:bg-sky-600"><DownloadIcon className="w-4 h-4"/> .txt</button>
                <button onClick={() => handleDownloadSelection('md')} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-sky-700 hover:bg-sky-600"><DownloadIcon className="w-4 h-4"/> .md</button>
              </footer>
            </>}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;