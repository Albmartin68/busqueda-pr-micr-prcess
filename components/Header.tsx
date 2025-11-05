import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { GearIcon } from './icons/GearIcon';

interface HeaderProps {
  onSettingsClick: () => void;
  onWorkbenchClick: () => void;
  onEditorPlusClick: () => void;
  onTechnicalDocGeneratorClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onWorkbenchClick, onEditorPlusClick, onTechnicalDocGeneratorClick }) => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm py-4 sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
            <SearchIcon className="w-8 h-8 text-sky-400 mr-3"/>
            <h1 className="text-2xl font-bold tracking-tight text-white">
            Micro-Process Search
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={onTechnicalDocGeneratorClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Abrir Generador de Documentos Técnicos"
            >
                <GearIcon className="w-5 h-5"/>
                Generador de Documentos Técnicos
            </button>
            <button 
              onClick={onEditorPlusClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open document editor"
            >
                <EditorPlusIcon className="w-5 h-5"/>
                Editor Plus
            </button>
            <button 
              onClick={onWorkbenchClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open workbench"
            >
                <WorkbenchIcon className="w-5 h-5"/>
                Mesa de Trabajo
            </button>
            <button 
              onClick={onSettingsClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open settings"
            >
                <SettingsIcon className="w-5 h-5"/>
                Ajustes
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;