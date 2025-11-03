import React, { useMemo, useEffect } from 'react';
import { WorkbenchSourceDocument } from '../../types';
import { DocIcon } from '../icons/FileIcons';

interface ViewerPanelProps {
    document: WorkbenchSourceDocument | null;
    searchQuery: string;
    highlightedParagraphId: string | null;
}

export const ViewerPanel: React.FC<ViewerPanelProps> = ({ document, searchQuery, highlightedParagraphId }) => {
    
    useEffect(() => {
        if (highlightedParagraphId) {
            const element = window.document.getElementById(highlightedParagraphId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-animation');
                setTimeout(() => {
                    element.classList.remove('highlight-animation');
                }, 2000); // Duración de la animación
            }
        }
    }, [highlightedParagraphId]);

    const renderedContent = useMemo(() => {
        if (!document || !document.content) return null;

        const paragraphs = document.content.split(/\n\s*\n/);
        const searchRegex = searchQuery.trim() ? new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi') : null;
        
        return paragraphs.map((p, index) => {
            const paragraphId = `${document.id}-p-${index}`;
            const parts = searchRegex ? p.split(searchRegex) : [p];

            return (
                <p key={paragraphId} id={paragraphId} className="mb-4">
                    {searchRegex ? parts.map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-sky-500/40 text-inherit rounded px-0.5">{part}</mark>
                        ) : (part)
                    ) : p}
                </p>
            );
        });
    }, [document, searchQuery]);
    
    return (
        <>
            <header className="p-3 border-b border-slate-700 flex-shrink-0">
                {document ? (
                    <h3 className="font-bold text-white truncate">{document.filename}</h3>
                ) : (
                    <h3 className="font-bold text-white">Visor de Documentos</h3>
                )}
            </header>
            <div className="flex-grow overflow-y-auto p-4 whitespace-pre-wrap font-serif text-gray-300 leading-relaxed document-viewer-content">
                {document ? (
                    renderedContent
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <DocIcon className="w-12 h-12 mb-4" />
                        <p>Seleccione un resultado de la izquierda para ver el documento fuente aquí.</p>
                    </div>
                )}
            </div>
            {document && (
                <footer className="p-2 border-t border-slate-700 flex justify-end gap-4 text-xs text-gray-400 flex-shrink-0">
                    <span>País: {document.country}</span>
                    <span>Idioma: {document.language.toUpperCase()}</span>
                </footer>
            )}
        </>
    );
};