import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm py-4 sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
            <SearchIcon className="w-8 h-8 text-sky-400 mr-3"/>
            <h1 className="text-2xl font-bold tracking-tight text-white">
            Micro-Process Search
            </h1>
        </div>
        <button 
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
          aria-label="Open settings"
        >
            <SettingsIcon className="w-5 h-5"/>
            Ajustes
        </button>
      </div>
    </header>
  );
};

export default Header;