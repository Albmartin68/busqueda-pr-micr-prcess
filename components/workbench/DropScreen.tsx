import React, { useRef, useState, useCallback } from 'react';
import { DocIcon } from '../icons/FileIcons';

interface DropScreenProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSearch: (query: string) => void;
}

export const DropScreen: React.FC<DropScreenProps> = ({ files, setFiles, searchQuery, setSearchQuery, onSearch }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropzoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles);
        setFiles(prev => {
            const existingNames = new Set(prev.map(f => f.name));
            return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
        });
    }, [setFiles]);
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSearch(searchQuery);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };
    
    return (
        <div className="flex flex-col gap-6 p-6 h-full">
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
            <div
                ref={dropzoneRef}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`flex-shrink-0 p-6 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ${isDragging ? 'border-sky-500 bg-slate-700/50' : 'border-slate-600'}`}
            >
                <p className="text-gray-400">Arrastra y suelta documentos aquí o</p>
                <button onClick={() => fileInputRef.current?.click()} className="text-sky-400 font-semibold hover:underline mt-1">
                    selecciona archivos
                </button>
                <p className="text-xs text-gray-500 mt-2">Archivos PDF y de texto plano (.txt, .md)</p>
            </div>
            
            {files.length > 0 && (
                <div className="flex-shrink-0 bg-slate-800/50 rounded-lg p-3 max-h-32 overflow-y-auto border border-slate-700/50">
                    <ul className="space-y-1 text-gray-300">
                        {files.map((f) => (
                        <li key={f.name} className="text-sm truncate flex items-center gap-2">
                            <DocIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>{f.name}</span>
                            <span className="text-xs text-gray-500 ml-auto">{(f.size / 1024).toFixed(1)} KB</span>
                        </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex-grow flex flex-col">
                <label htmlFor="workbench-query" className="text-lg font-semibold mb-2 text-gray-200">
                    Describe el hecho que quieres comparar:
                </label>
                <textarea
                    id="workbench-query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full flex-grow bg-slate-800 border border-slate-700 rounded-md p-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-base leading-relaxed resize-none"
                    placeholder='Ej: "¿Qué sanciones hay por exceso de velocidad superior en 50 km/h en vías urbanas, especialmente en Latinoamérica?"'
                />
            </div>
        </div>
    );
};