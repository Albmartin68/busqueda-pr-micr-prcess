
import React from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar documentos, videos, noticias..."
        className="w-full pl-5 pr-28 py-4 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg placeholder-gray-400"
        disabled={isLoading}
      />
      <button
        onClick={onSearch}
        disabled={isLoading}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-full disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <SearchIcon className="w-5 h-5 mr-2"/>
        <span>Buscar</span>
      </button>
    </div>
  );
};

export default SearchBar;