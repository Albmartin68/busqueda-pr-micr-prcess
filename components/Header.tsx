
import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { GearIcon } from './icons/GearIcon';
import { HelpIcon } from './icons/HelpIcon';
import { FolderIcon } from './icons/FolderIcon';

interface HeaderProps {
  onSettingsClick: () => void;
  onWorkbenchClick: () => void;
  onEditorPlusClick: () => void;
  onTechnicalDocGeneratorClick: () => void;
  onGuideClick: () => void;
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onWorkbenchClick, onEditorPlusClick, onTechnicalDocGeneratorClick, onGuideClick, onHistoryClick }) => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm py-4 sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
            <SearchIcon className="w-8 h-8 text-sky-400 mr-3"/>
            <h1 className="text-2xl font-bold tracking-tight text-white hidden md:block">
            Plataforma de Estudio Multimodal
            </h1>
            <h1 className="text-xl font-bold tracking-tight text-white md:hidden">
            PEM
            </h1>
        </div>
        <div className="flex items-center gap-2">
             <button
              onClick={onHistoryClick}
              className="flex items-center gap-2 px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 rounded-lg text-sm font-semibold transition-colors text-amber-100"
              aria-label="Abrir historial de archivos"
              title="Historial y Descargas"
            >
                <FolderIcon className="w-5 h-5 text-amber-400"/>
                <span className="hidden lg:inline">Historial</span>
            </button>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <button
              onClick={onGuideClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Abrir guía interactiva"
              title="Guía"
            >
                <HelpIcon className="w-5 h-5"/>
            </button>
            <button
              onClick={onTechnicalDocGeneratorClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Abrir Generador de Documentos Técnicos"
              title="Generador Técnico"
            >
                <GearIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={onEditorPlusClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open document editor"
              title="Editor Plus"
            >
                <EditorPlusIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={onWorkbenchClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open workbench"
              title="Mesa de Trabajo"
            >
                <WorkbenchIcon className="w-5 h-5"/>
            </button>
            <button 
              onClick={onSettingsClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              aria-label="Open settings"
              title="Ajustes"
            >
                <SettingsIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
