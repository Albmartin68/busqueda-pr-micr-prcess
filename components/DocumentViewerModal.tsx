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
    const content = Object.values(selectedFlashcards).map((fc: FlashcardItem) => fc.context).join('\n\n');
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `selection.${format}`;
    window.document.body.appendChild(a);
    a.click();
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
        {isTranslationLoading && <div className="flex items-center justify-center p-2 text-sm text-gray-400 bg-slate-800"><SpinnerIcon className="w-4 h-4 mr-2"/> Traducción en curso...</div>}
        {translationError && <div className="flex items-center justify-center p-2 text-sm text-red-400 bg-red-900/20">{translationError}</div>}

        <div className="flex-grow flex overflow-hidden">
            {/* Main Content Viewer */}
            <div className="flex-grow overflow-y-auto">
                <div className="p-6 md:p-8 whitespace-pre-wrap text-gray-300 leading-relaxed document-content">
                    {isSummaryLoading ? (
                        <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8"/></div>
                    ) : (
                        renderContent
                    )}
                </div>
            </div>

            {/* Right Side Panels */}
            {(isSearchPanelOpen || isExportPanelOpen) && (
                <aside className="flex-shrink-0 w-96 border-l border-slate-800 flex flex-col transition-all duration-300">
                    {/* Search Panel */}
                    {isSearchPanelOpen && (
                        <div className={`flex flex-col ${isExportPanelOpen ? 'h-1/2' : 'h-full'}`}>
                            <header className="p-3 border-b border-slate-700 flex-shrink-0">
                                <h3 className="font-bold text-white">Resultados ({flashcards.length})</h3>
                            </header>
                            <div className="overflow-y-auto p-2 space-y-2 flex-grow">
                                {flashcards.length > 0 ? flashcards.map(card => (
                                    <div key={card.id} onClick={() => handleFlashcardClick(card)} className={`p-2 rounded-md cursor-pointer transition-colors flex items-start gap-2 ${activeFlashcardId === card.id ? 'bg-sky-800' : 'hover:bg-slate-700'}`}>
                                        <input type="checkbox" checked={!!selectedFlashcards[card.id]} onChange={() => handleToggleFlashcardSelection(card)} onClick={e => e.stopPropagation()} className="mt-1 accent-sky-500" />
                                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: card.snippet }} />
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 text-center p-4">No se encontraron resultados.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Export Panel */}
                    {isExportPanelOpen && (
                        <div className={`flex flex-col ${isSearchPanelOpen ? 'h-1/2 border-t border-slate-800' : 'h-full'}`}>
                             <header className="p-3 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                                <h3 className="font-bold text-white">Exportar Selección ({Object.keys(selectedFlashcards).length})</h3>
                            </header>
                            <div className="p-4 space-y-4">
                                <button onClick={() => handleCopy(Object.values(selectedFlashcards).map((fc: FlashcardItem) => fc.context).join('\n\n'), setIsSelectionCopied)}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${isSelectionCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                    {isSelectionCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}
                                    {isSelectionCopied ? '¡Copiado!' : 'Copiar Selección'}
                                </button>
                                <button onClick={() => handleDownloadSelection('txt')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600">
                                   Descargar como .txt
                                </button>
                                 <button onClick={() => handleDownloadSelection('md')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600">
                                   Descargar como .md
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
