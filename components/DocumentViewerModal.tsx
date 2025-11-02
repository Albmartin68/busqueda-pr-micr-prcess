import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DocumentResult } from '../types';
import { translateDocumentContent } from '../services/geminiService';
import { TRANSLATION_LANGUAGES } from '../constants';

import { SpinnerIcon } from './icons/SpinnerIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { SwarmIcon } from './icons/SwarmIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface DocumentViewerModalProps {
  document: DocumentResult;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose }) => {
  const [displayedContent, setDisplayedContent] = useState<string>(document.content);
  const [isTranslated, setIsTranslated] = useState<boolean>(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>(TRANSLATION_LANGUAGES[0].value);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // State for internal search
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<HTMLElement[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);


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

  useEffect(() => {
    // Reset internal search when document changes or content is translated/restored
    setInternalSearchQuery('');
  }, [document, displayedContent]);

  const handleTranslate = async () => {
    setIsLoadingTranslation(true);
    setTranslationError(null);
    try {
      const translatedChunks = await translateDocumentContent(document.content, targetLanguage);
      setDisplayedContent(translatedChunks.join('\n\n'));
      setIsTranslated(true);
    } catch (error) {
      setTranslationError('Error al traducir. Por favor, inténtelo de nuevo.');
      console.error(error);
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const restoreOriginal = () => {
    setDisplayedContent(document.content);
    setIsTranslated(false);
    setTranslationError(null);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(contentRef.current?.innerText || displayedContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // --- Internal Search Logic ---
  useEffect(() => {
    // This effect runs after the content is rendered with new highlights
    if (contentRef.current && internalSearchQuery) {
        const marks = Array.from(contentRef.current.querySelectorAll('mark'));
        setSearchMatches(marks);
        setCurrentMatchIndex(marks.length > 0 ? 0 : -1);
    } else {
        setSearchMatches([]);
        setCurrentMatchIndex(0);
    }
  }, [internalSearchQuery, displayedContent]);

  useEffect(() => {
    if (searchMatches.length > 0 && currentMatchIndex >= 0) {
        searchMatches.forEach((el, index) => {
            // Remove all possible dynamic highlight styles
            el.classList.remove('bg-yellow-300', 'text-black', 'ring-2', 'ring-yellow-400', 'bg-sky-400', 'text-slate-900');
            el.classList.remove('bg-sky-500/40'); // Remove new inactive style
            
            if (index === currentMatchIndex) {
                el.classList.add('bg-yellow-300', 'text-black', 'ring-2', 'ring-yellow-400');
            } else {
                // Add back the inactive style
                el.classList.add('bg-sky-500/40');
            }
        });
        const currentMatch = searchMatches[currentMatchIndex];
        currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, searchMatches]);

  const goToNextMatch = () => {
      if (searchMatches.length === 0) return;
      setCurrentMatchIndex(prev => (prev + 1) % searchMatches.length);
  };

  const goToPrevMatch = () => {
       if (searchMatches.length === 0) return;
      setCurrentMatchIndex(prev => (prev - 1 + searchMatches.length) % searchMatches.length);
  };

  const handleInternalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if(e.key === 'Enter') {
          if (searchMatches.length > 0) {
              goToNextMatch();
          }
      }
  }

  // --- Content Rendering with Images and Highlighting ---
  const renderContentWithHighlightsAndImages = useMemo(() => {
    const contentToRender = displayedContent;
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = contentToRender.split(imageRegex);

    return parts.map((part, index) => {
      if (index % 3 === 1) { // This is the alt text
        const altText = part;
        const imageUrl = parts[index + 1];
        return (
          <div key={index} className="my-6 flex justify-center">
            <figure className="max-w-full bg-slate-800/50 rounded-lg shadow-lg border border-slate-700">
              <img 
                src={imageUrl} 
                alt={altText} 
                className="max-w-full rounded-t-md"
              />
              {altText && (
                <figcaption className="p-3 text-center text-sm text-gray-400 italic">
                  {altText}
                </figcaption>
              )}
            </figure>
         </div>
        );
      }
      if (index % 3 === 2) { // This is the image URL, already handled
        return null;
      }

      const textPart = part;
      if (!internalSearchQuery) {
        return <span key={index}>{textPart}</span>;
      }
      
      const searchRegex = new RegExp(`(${internalSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      const textChunks = textPart.split(searchRegex);
      
      return (
        <span key={index}>
          {textChunks.map((chunk, i) => 
            chunk.toLowerCase() === internalSearchQuery.toLowerCase() ? (
              <mark key={i} className="bg-sky-500/40 text-inherit rounded px-0.5">{chunk}</mark>
            ) : (
              <span key={i}>{chunk}</span>
            )
          )}
        </span>
      );
    });
  }, [displayedContent, internalSearchQuery]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white truncate pr-4">{document.title}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isCopied 
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                }`}
            >
                {isCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}
                {isCopied ? '¡Copiado!' : 'Copiar'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close viewer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </header>

        <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center flex-shrink-0">
             {/* Internal Search */}
            <div className="relative w-full md:max-w-sm">
                <input
                    type="text"
                    value={internalSearchQuery}
                    onChange={e => setInternalSearchQuery(e.target.value)}
                    onKeyDown={handleInternalSearchKeyDown}
                    placeholder="Buscar dentro del documento..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-9 pr-24 text-sm focus:ring-sky-500 focus:border-sky-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-400"/>
                </div>
                {internalSearchQuery && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <span className="text-xs text-gray-400 mr-1">{searchMatches.length > 0 ? `${currentMatchIndex + 1} de ${searchMatches.length}` : '0 de 0'}</span>
                        <button onClick={goToPrevMatch} disabled={searchMatches.length === 0} className="p-1 rounded-md hover:bg-slate-600 disabled:opacity-50"><ChevronUpIcon className="w-4 h-4"/></button>
                        <button onClick={goToNextMatch} disabled={searchMatches.length === 0} className="p-1 rounded-md hover:bg-slate-600 disabled:opacity-50"><ChevronDownIcon className="w-4 h-4"/></button>
                    </div>
                )}
            </div>
            {/* Language Tools */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isLoadingTranslation}
                className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-2 pr-8 text-sm focus:ring-sky-500 focus:border-sky-500 appearance-none"
              >
                {TRANSLATION_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
              </select>
              {isTranslated ? (
                <button onClick={restoreOriginal} className="text-sm px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md">Restaurar Original</button>
              ) : (
                <button onClick={handleTranslate} disabled={isLoadingTranslation} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-md disabled:bg-slate-500 w-32 justify-center">
                  {isLoadingTranslation ? <SpinnerIcon className="w-4 h-4"/> : <TranslateIcon className="w-4 h-4"/>}
                  <span>{isLoadingTranslation ? 'Traduciendo...' : 'Traducir'}</span>
                </button>
              )}
            </div>
        </div>
        {isLoadingTranslation && (
            <div className="flex items-center justify-center p-2 bg-slate-800 text-sm text-sky-400 border-b border-slate-800">
                <SwarmIcon className="w-4 h-4 mr-2"/>
                El enjambre de micro-procesadores está traduciendo...
            </div>
        )}
        {translationError && <p className="p-2 text-center text-sm bg-red-900/50 text-red-400">{translationError}</p>}

        <div ref={contentRef} className="document-viewer-content p-6 md:p-8 flex-grow overflow-y-auto whitespace-pre-wrap text-gray-300 leading-relaxed font-serif text-[17px]">
           {renderContentWithHighlightsAndImages}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;