import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SearchResult, DocumentResult, FilterOptions, ActiveTab } from './types';
import { fetchSearchResults } from './services/geminiService';
import { INITIAL_FILTERS } from './constants';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Filters from './components/Filters';
import ResultsTabs from './components/ResultsTabs';
import ResultCard from './components/ResultCard';
import DocumentViewerModal from './components/DocumentViewerModal';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import SettingsModal from './components/SettingsModal';
import { FilePlusIcon } from './components/icons/FilePlusIcon';
import TemplateGeneratorModal from './components/TemplateGeneratorModal';

export default function App(): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = window.setInterval(() => {
        setSearchTime(prevTime => prevTime + 0.1);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError('Por favor, ingrese una consulta de búsqueda.');
      return;
    }
    // Update the state so the search bar reflects the current query
    if (query !== searchQuery) {
      setQuery(searchQuery);
    }

    setSearchTime(0);
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const searchResults = await fetchSearchResults(searchQuery, filters);
      setResults(searchResults);
    } catch (e) {
      console.error(e);
      setError('Ocurrió un error al obtener los resultados. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, query]);

  const handleSpecializedSearch = (prompt: string) => {
    handleSearch(prompt);
    setIsTemplateModalOpen(false);
  };

  const handleViewDocument = (doc: DocumentResult) => {
    setSelectedDocument(doc);
  };

  const displayedResults = useMemo(() => {
    if (!results) return [];
    if (activeTab === 'all') {
      return Object.values(results).flat();
    }
    return results[activeTab] || [];
  }, [results, activeTab]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto">
          <SearchBar query={query} setQuery={setQuery} onSearch={() => handleSearch(query)} isLoading={isLoading} />
          {error && <p className="text-red-400 mt-2 text-center">{error}</p>}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-3 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-semibold text-sky-300 hover:text-sky-200 transition-colors duration-200"
            >
              <FilePlusIcon className="w-5 h-5" />
              Búsqueda Especializada
            </button>
          </div>
        </div>

        <div className="mt-8 max-w-7xl mx-auto">
          <div className="w-full">
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <SpinnerIcon className="w-12 h-12" />
                <p className="ml-4 text-lg">Buscando... ({searchTime.toFixed(1)}s)</p>
              </div>
            )}

            {results && !isLoading && (
              <>
                <ResultsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="mt-4 space-y-4">
                  {displayedResults.length > 0 ? (
                    displayedResults.map((item) => (
                      <ResultCard key={item.id} item={item} onViewDocument={handleViewDocument} />
                    ))
                  ) : (
                    <div className="text-center py-10 bg-slate-800/50 rounded-lg">
                      <p className="text-gray-400">No se encontraron resultados para esta categoría.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {!results && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-64 bg-slate-800/50 rounded-lg text-center p-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Bienvenido a Micro-Process Search</h3>
                    <p className="text-gray-400 max-w-md">Ingrese una consulta arriba y use los filtros para encontrar documentos validados, videos, noticias y más de todo el mundo.</p>
                </div>
            )}
          </div>
        </div>
      </main>

      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
      
      {isTemplateModalOpen && (
        <TemplateGeneratorModal 
          onClose={() => setIsTemplateModalOpen(false)}
          onSearch={handleSpecializedSearch}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)}>
            <Filters filters={filters} setFilters={setFilters} />
        </SettingsModal>
      )}
    </div>
  );
}