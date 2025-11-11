import React from 'react';
import { SearchResultItem, DocumentResult } from '../types';
import { DocIcon, DocxIcon, XlsxIcon, PptxIcon, EpubIcon, HtmlIcon, TxtIcon } from './icons/FileIcons';
import { VideoIcon } from './icons/VideoIcon';
import { NewsIcon } from './icons/NewsIcon';
import { EyeIcon } from './icons/EyeIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface ResultCardProps {
  item: SearchResultItem;
  onViewDocument: (doc: DocumentResult) => void;
}

const FileTypeIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'PDF': return <DocIcon className="w-5 h-5" />;
        case 'DOCX': return <DocxIcon className="w-5 h-5" />;
        case 'XLSX': return <XlsxIcon className="w-5 h-5" />;
        case 'PPTX': return <PptxIcon className="w-5 h-5" />;
        case 'EPUB': return <EpubIcon className="w-5 h-5" />;
        case 'HTML': return <HtmlIcon className="w-5 h-5" />;
        case 'TXT': return <TxtIcon className="w-5 h-5" />;
        default: return <DocIcon className="w-5 h-5" />;
    }
};

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
    switch(category) {
        case 'documents': return <DocIcon className="w-6 h-6 text-sky-400"/>;
        case 'videos': return <VideoIcon className="w-6 h-6 text-rose-400"/>;
        case 'news': return <NewsIcon className="w-6 h-6 text-amber-400"/>;
        case 'forums': return <UsersIcon className="w-6 h-6 text-teal-400"/>;
        case 'events': return <CalendarIcon className="w-6 h-6 text-indigo-400"/>;
        case 'magazines': return <BookOpenIcon className="w-6 h-6 text-lime-400"/>;
        default: return <GlobeIcon className="w-6 h-6 text-gray-400"/>;
    }
};

const ResultCard: React.FC<ResultCardProps> = ({ item, onViewDocument }) => {

  return (
    <div className="bg-slate-800/70 p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-slate-800 hover:shadow-xl border border-transparent hover:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 bg-slate-700 rounded-lg">
                <CategoryIcon category={item.category} />
            </div>
            <div className="flex-grow">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-sky-400 hover:underline">{item.title}</a>
                <p className="text-sm text-gray-400 mt-1">{item.snippet}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                    <span className="font-semibold text-gray-400">Fuente: {item.source}</span>
                    {item.category === 'documents' && (
                        <>
                            <span className="flex items-center gap-1"><FileTypeIcon type={item.type} /> {item.type}</span>
                            <span>Idioma: {item.language}</span>
                            <span>País: {item.country}</span>
                            <span className="text-green-400 font-bold px-2 py-0.5 bg-green-900/50 rounded-full">{item.certification}</span>
                        </>
                    )}
                    {(item.category === 'news' || item.category === 'events' || item.category === 'forums') && <span>Fecha: {item.date}</span>}
                    {item.category === 'forums' && <span>Autor: {item.author}</span>}
                </div>
            </div>
            {item.category === 'documents' && (
                <div className="flex sm:flex-col items-center justify-start sm:justify-center gap-2 mt-2 sm:mt-0">
                    <button onClick={() => onViewDocument(item)} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md transition-colors w-full sm:w-auto justify-center">
                        <EyeIcon className="w-4 h-4"/> Ver
                    </button>
                    <a href={item.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm bg-sky-700 hover:bg-sky-600 px-3 py-2 rounded-md transition-colors w-full sm:w-auto justify-center">
                        <DownloadIcon className="w-4 h-4"/> Descargar
                    </a>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResultCard;