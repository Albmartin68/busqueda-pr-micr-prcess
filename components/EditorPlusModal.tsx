import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, H1Icon, H2Icon, H3Icon, ListIcon, ListOrderedIcon, LinkIcon, QuoteIcon, MessageSquareIcon
} from './icons/EditorToolbarIcons';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { assetService } from '../services/editorPlus/assetService';
import { renderService } from '../services/editorPlus/renderService';
import { docService } from '../services/editorPlus/docService';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import PublishModal from './PublishModal';


// --- TYPE DEFINITIONS ---
interface EditorPlusModalProps {
  onClose: () => void;
}
export interface Heading {
  id: string;
  text: string;
  tagName: string;
}
export interface Comment {
  id: string;
  targetId: string;
  text: string;
  author: string;
  resolved: boolean;
}
export interface Asset {
  id: string;
  src: string;
  name: string;
  file: File;
}
export type CitationStyle = 'APA' | 'MLA' | 'Chicago';
type SyncStatus = 'synced' | 'saving' | 'edited' | 'offline';

// --- HELPER & UTILITY COMPONENTS ---
const ToolbarButton: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; children: React.ReactNode; title: string, active?: boolean }> = ({ onMouseDown, children, title, active }) => (
  <button
    onMouseDown={onMouseDown}
    title={title}
    className={`p-2 rounded transition-colors ${active ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-slate-600 hover:text-white'}`}
  >
    {children}
  </button>
);

const Toast: React.FC<{ message: string; show: boolean; icon?: React.ReactNode }> = ({ message, show, icon }) => {
  if (!show) return null;
  return (
    <div className="toast-notification animate-fade-in-out">
      {icon}
      <span>{message}</span>
    </div>
  );
};


// --- MAIN COMPONENT ---
const EditorPlusModal: React.FC<EditorPlusModalProps> = ({ onClose }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<number | null>(null);

  // State Management
  const [wordCount, setWordCount] = useState(0);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [references, setReferences] = useState<Map<string, string>>(new Map());
  const [activeSidebarTab, setActiveSidebarTab] = useState('índice');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentTarget, setActiveCommentTarget] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; icon?: React.ReactNode | null }>({ show: false, message: '', icon: null });

  // Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Cloud-connected state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');


  // Effects
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // --- EDITOR CORE & STATE UPDATES ---
  const handleSave = useCallback(async () => {
    if (!editorRef.current || syncStatus === 'saving') return;
    setSyncStatus('saving');
    try {
        await docService.saveDocument('doc-1', editorRef.current.innerHTML);
        setSyncStatus('synced');
    } catch (e) {
        console.error("Save failed", e);
        setSyncStatus('offline');
    }
  }, [syncStatus]);

  const updateEditorState = useCallback(() => {
    if (!editorRef.current) return;
    const editorNode = editorRef.current;
    
    const text = editorNode.innerText || '';
    setWordCount(text.match(/\b\w+\b/g)?.length || 0);

    const headingNodes = editorNode.querySelectorAll('h1, h2, h3');
    const foundHeadings = Array.from(headingNodes).map((node, index) => {
      const el = node as HTMLElement;
      const text = el.innerText;
      let id = el.id || text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + `-${index}`;
      el.id = id;
      return { id, text, tagName: el.tagName.toLowerCase() };
    });
    setHeadings(foundHeadings);

    setSyncStatus('edited');
    if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = window.setTimeout(handleSave, 2000); // Autosave after 2 seconds of inactivity

  }, [handleSave]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateEditorState();
  };

  // --- IMAGE & ASSET HANDLING (EU-1, EU-6) ---
  const showToast = (message: string, duration = 3000, icon: React.ReactNode = <SpinnerIcon className="w-5 h-5" />) => {
    setToast({ show: true, message, icon });
    if (duration > 0) {
      setTimeout(() => setToast({ show: false, message: '', icon: null }), duration);
    }
  };

  const insertHtmlInEditor = (html: string) => {
    document.execCommand('insertHTML', false, '<p id="temp-insert-placeholder">&nbsp;</p>');
    const placeholder = editorRef.current?.querySelector('#temp-insert-placeholder');
    if (placeholder) {
        placeholder.outerHTML = html;
    }
  };

  const processAndInsertImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    showToast('Procesando imagen...', 0);
    try {
        const figureHTML = await assetService.processNewImage(file);
        insertHtmlInEditor(figureHTML);
        showToast('Imagen insertada', 2000, <CheckIcon className="w-5 h-5 text-green-400"/>);
        updateEditorState();
    } catch (error) {
        console.error("Error processing image:", error);
        showToast('Error al procesar imagen', 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    }
  }, [updateEditorState]);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const assetId = e.dataTransfer.getData('application/asset-id');
    if (assetId) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
            const figureHTML = assetService.createFigureHtml(asset.src, asset.name);
            insertHtmlInEditor(figureHTML + '<p>&nbsp;</p>'); // Add paragraph for better flow
            updateEditorState();
            showToast('Imagen insertada desde activos', 2000, <CheckIcon className="w-5 h-5 text-green-400"/>);
        }
        return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await processAndInsertImage(e.dataTransfer.files[0]);
    }
  }, [assets, processAndInsertImage, updateEditorState]);

  // FIX: Use for...of loop for better type inference on FileList items.
  const handleAddAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (const file of e.target.files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const newAsset: Asset = {
              id: `asset-${Date.now()}-${file.name}`,
              src: event.target?.result as string,
              name: file.name,
              file: file,
            };
            setAssets(prev => [...prev, newAsset]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  
  const handleAssetDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('application/asset-id', asset.id);
  };

  const handleOcrClick = async (asset: Asset) => {
    showToast('Extrayendo texto (OCR)...', 0);
    try {
        const text = await assetService.extractTextFromImage(asset.file);
        await navigator.clipboard.writeText(text);
        showToast('Texto extraído y copiado al portapapeles', 3000, <CheckIcon className="w-5 h-5 text-green-400"/>);
    } catch(e) {
        showToast('Error al extraer texto', 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    }
  };
  
  // --- CITATIONS (EU-2) ---
  const handleAddCitation = (author: string, year: string, title: string, style: CitationStyle) => {
    if (!author || !year || !title) return;
    const key = `${author.split(' ')[0]}${year}`;
    let inTextCitation = '';
    let fullReference = '';

    switch (style) {
        case 'APA':
            inTextCitation = `(${author}, ${year})`;
            fullReference = `${author} (${year}). *${title}*.`;
            break;
        case 'MLA':
            inTextCitation = `(${author})`;
            fullReference = `${author}. *${title}*.`;
            break;
        case 'Chicago':
            const refNumber = references.size + 1;
            inTextCitation = `<sup>${refNumber}</sup>`;
            fullReference = `${refNumber}. ${author}, *${title}*, (${year}).`;
            break;
    }
    
    if (selectionRangeRef.current) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(selectionRangeRef.current);
        document.execCommand('insertHTML', false, inTextCitation);
    }
    
    setReferences(prev => new Map(prev).set(key, fullReference));
    setIsCitationModalOpen(false);
    updateEditorState();
  };

  // --- COMMENTS (EU-4) ---
  const handleCommentButtonClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      const range = selection.getRangeAt(0);
      const commentId = `comment-${Date.now()}`;
      const span = document.createElement('span');
      span.className = 'comment-highlight';
      span.id = commentId;
      try {
        range.surroundContents(span);
        setActiveSidebarTab('comments');
        setActiveCommentTarget(commentId);
      } catch (e) {
        console.error("Could not wrap selection:", e);
        alert("No se pudo agregar un comentario a esta selección. Intente seleccionar texto dentro de un solo bloque.");
      }
    } else {
      alert("Por favor, seleccione el texto que desea comentar.");
    }
  };

  const addComment = (text: string) => {
    if (text.trim() && activeCommentTarget) {
      const newComment: Comment = {
        id: `c-text-${Date.now()}`,
        targetId: activeCommentTarget,
        text,
        author: 'Usuario 1',
        resolved: false,
      };
      setComments(prev => [...prev, newComment]);
      setActiveCommentTarget(null);
    }
  };

  const toggleResolveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };
  
  // --- UI & EVENT HANDLERS ---
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const targetId = target.getAttribute('href')!.substring(1);
      editorRef.current?.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (target.classList.contains('comment-highlight')) {
        setActiveSidebarTab('comments');
        setTimeout(() => {
            document.querySelector(`[data-comment-for="${target.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  };
  
  const handleExportPDF = async () => {
    if (!editorRef.current) return;
    try {
        await renderService.exportToPdf(editorRef.current, (message) => showToast(message, 0));
        showToast('Descarga iniciada', 2000, <CheckIcon className="w-5 h-5 text-green-400"/>);
    } catch (err) {
        console.error("Error exporting to PDF:", err);
        showToast('Error al exportar a PDF', 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    }
  };

  const SyncStatusIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const statusMap = {
        saving: { text: 'Guardando...', icon: <SpinnerIcon className="w-4 h-4" /> },
        synced: { text: 'Sincronizado', icon: <CheckIcon className="w-4 h-4 text-green-400" /> },
        edited: { text: 'Cambios sin guardar', icon: <div className="w-3 h-3 rounded-full bg-amber-400"></div> },
        offline: { text: 'Sin conexión', icon: <XIcon className="w-4 h-4 text-red-400" /> },
    };
    const { text, icon } = statusMap[status];
    return <div className="flex items-center gap-2">{icon}<span>{text}</span></div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4" onClick={onClose}>
      <input type="file" ref={fileInputRef} onChange={handleAddAsset} accept="image/*" multiple className="hidden" />
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3"><EditorPlusIcon className="w-6 h-6 text-sky-400" /> Editor Plus</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center user-avatar-stack">
                <img src="https://i.pravatar.cc/32?u=a" alt="User A" className="w-8 h-8 rounded-full border-2 border-slate-700"/>
                <img src="https://i.pravatar.cc/32?u=b" alt="User B" className="w-8 h-8 rounded-full border-2 border-slate-700"/>
                <div className="w-8 h-8 rounded-full bg-sky-800 border-2 border-slate-700 flex items-center justify-center text-xs font-bold">+2</div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-white">
                    <UploadCloudIcon className="w-5 h-5"/> Publicar
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white">
                    <DownloadIcon className="w-5 h-5" /> Exportar PDF
                </button>
                <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex overflow-hidden bg-slate-800">
          {/* Left Sidebar */}
          <aside className="w-64 bg-slate-900/50 p-4 border-r border-slate-700 flex-shrink-0 flex flex-col">
            <div className="flex-shrink-0 flex border-b border-slate-700 mb-4">
              {['Índice', 'Activos'].map(tab => (
                <button key={tab} onClick={() => setActiveSidebarTab(tab.toLowerCase())}
                  className={`flex-1 py-2 text-sm font-semibold ${activeSidebarTab === tab.toLowerCase() ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            {activeSidebarTab === 'índice' && (
              <ul className="text-sm text-gray-400 space-y-2 overflow-y-auto">
                {headings.length > 0 ? headings.map(h => (
                  <li key={h.id} className="cursor-pointer hover:text-white truncate" onClick={() => editorRef.current?.querySelector(`#${h.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} title={h.text}>
                    {h.tagName === 'h1' && <span className="font-semibold">{h.text}</span>}
                    {h.tagName === 'h2' && <span className="pl-3">{h.text}</span>}
                    {h.tagName === 'h3' && <span className="pl-6 text-gray-500">{h.text}</span>}
                  </li>
                )) : <li className="text-gray-500 italic">No hay encabezados.</li>}
              </ul>
            )}
            {activeSidebarTab === 'activos' && (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-grow">
                  {assets.map(asset => (
                    <div key={asset.id} className="relative group">
                        <img src={asset.src} alt={asset.name} title={asset.name} draggable="true" onDragStart={(e) => handleAssetDragStart(e, asset)}
                        className="w-full h-16 object-cover rounded-md cursor-grab border-2 border-transparent group-hover:border-sky-400"/>
                        <div className="image-options">
                            <button title="Extraer Texto (OCR)" onClick={() => handleOcrClick(asset)} className="p-1 rounded-sm bg-slate-700/50 hover:bg-slate-600"><BookOpenIcon className="w-4 h-4 text-white"/></button>
                        </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 flex-shrink-0 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md">
                    <FilePlusIcon className="w-4 h-4"/> Añadir Imagen
                </button>
              </div>
            )}
          </aside>

          {/* Editor */}
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-1 flex items-center gap-1 flex-wrap">
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('bold'); }} title="Negrita"><BoldIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('italic'); }} title="Cursiva"><ItalicIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('underline'); }} title="Subrayado"><UnderlineIcon className="w-5 h-5" /></ToolbarButton>
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('formatBlock', '<h1>'); }} title="Encabezado 1"><H1Icon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('formatBlock', '<h2>'); }} title="Encabezado 2"><H2Icon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('formatBlock', '<h3>'); }} title="Encabezado 3"><H3Icon className="w-5 h-5" /></ToolbarButton>
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} title="Lista"><ListIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} title="Lista numerada"><ListOrderedIcon className="w-5 h-5" /></ToolbarButton>
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); const selection = window.getSelection(); if (selection && !selection.getRangeAt(0).collapsed) { selectionRangeRef.current = selection.getRangeAt(0).cloneRange(); setIsLinkModalOpen(true); } else { alert('Seleccione texto para enlazar.'); } }} title="Enlace interno"><LinkIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); const selection = window.getSelection(); if (selection && !selection.getRangeAt(0).collapsed) { selectionRangeRef.current = selection.getRangeAt(0).cloneRange(); setIsCitationModalOpen(true); } else { alert('Seleccione dónde insertar la cita.'); } }} title="Citar"><QuoteIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommentButtonClick(); }} title="Comentar"><MessageSquareIcon className="w-5 h-5" /></ToolbarButton>
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); alert('Historial de versiones - Próximamente'); }} title="Historial"><HistoryIcon className="w-5 h-5" /></ToolbarButton>
            </div>
            
            {/* Editable Area */}
            <div className="flex-grow overflow-y-auto p-4 relative" onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={handleEditorClick}>
              <div ref={editorRef} className="document-editor-page" contentEditable={true} onInput={updateEditorState} suppressContentEditableWarning={true}>
                  <h1>Título del Documento</h1>
                  <p>Comience a escribir su contenido aquí. Puede usar la barra de herramientas para dar formato al texto, agregar encabezados, listas y más. Arrastre una imagen para agregarla al documento.</p>
                  <div id="references-section" contentEditable="false" className="mt-12 pt-6 border-t border-slate-300">
                    <h2 style={{fontSize: '16pt', fontWeight: 'bold'}}>Referencias</h2>
                    {Array.from(references.values()).map((ref, i) => <p key={i} style={{fontSize: '11pt', margin: '0.5em 0'}}>{ref}</p>)}
                  </div>
              </div>
              {isDragging && <div className="drag-over-overlay"><span>Soltar imagen para añadir</span></div>}
              <Toast {...toast} />
              
              {isLinkModalOpen && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center" onClick={() => setIsLinkModalOpen(false)}>
                  <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Enlazar a Encabezado</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {headings.length > 0 ? headings.map(h => (
                        <button
                          key={h.id}
                          onClick={() => {
                            if (selectionRangeRef.current) {
                              const selection = window.getSelection();
                              selection?.removeAllRanges();
                              selection?.addRange(selectionRangeRef.current);
                              document.execCommand('createLink', false, `#${h.id}`);
                            }
                            setIsLinkModalOpen(false);
                            updateEditorState();
                          }}
                          className="w-full text-left p-2 rounded hover:bg-slate-700 transition-colors"
                        >
                          <span className={`font-semibold ${h.tagName === 'h2' ? 'pl-3' : ''} ${h.tagName === 'h3' ? 'pl-6' : ''}`}>
                            {h.text}
                          </span>
                        </button>
                      )) : <p className="text-gray-500">No hay encabezados para enlazar.</p>}
                    </div>
                    <div className="flex justify-end mt-4">
                      <button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 bg-slate-600 rounded">Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
              {isCitationModalOpen && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center" onClick={() => setIsCitationModalOpen(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); handleAddCitation(data.get('author') as string, data.get('year') as string, data.get('title') as string, data.get('style') as CitationStyle); }}
                        className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold">Añadir Citación</h3>
                        <input name="author" placeholder="Autor (e.g., Smith, J. D.)" required className="w-full bg-slate-700 p-2 rounded"/>
                        <input name="year" placeholder="Año (e.g., 2023)" required className="w-full bg-slate-700 p-2 rounded"/>
                        <input name="title" placeholder="Título" required className="w-full bg-slate-700 p-2 rounded"/>
                        <select name="style" className="w-full bg-slate-700 p-2 rounded">
                            <option value="APA">APA</option><option value="MLA">MLA</option><option value="Chicago">Chicago</option>
                        </select>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCitationModalOpen(false)} className="px-4 py-2 bg-slate-600 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-sky-600 rounded">Insertar</button></div>
                    </form>
                 </div>
              )}
            </div>
          </div>
           {/* Right Sidebar (Comments) */}
          <aside className="w-80 bg-slate-900/50 p-4 border-l border-slate-700 flex-shrink-0 flex flex-col">
              <div className="flex-shrink-0 flex border-b border-slate-700 mb-4">
                  <button onClick={() => setActiveSidebarTab('comments')} className="flex-1 py-2 text-sm font-semibold text-sky-400 border-b-2 border-sky-400">Comentarios ({comments.filter(c => !c.resolved).length})</button>
              </div>
              <div className="overflow-y-auto space-y-4 flex-grow">
                  {comments.map(comment => (
                      <div key={comment.id} data-comment-for={comment.targetId} onClick={() => editorRef.current?.querySelector(`#${comment.targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          className={`p-3 rounded-md border-l-4 ${comment.resolved ? 'bg-slate-800 border-green-500' : 'bg-slate-700/50 border-amber-400'}`}>
                          <p className="text-sm text-gray-300">{comment.text}</p>
                          <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                              <span>{comment.author}</span>
                              <button onClick={() => toggleResolveComment(comment.id)} className="hover:text-white">{comment.resolved ? 'Reabrir' : 'Resolver'}</button>
                          </div>
                      </div>
                  ))}
                  {activeCommentTarget && (
                      <div className="p-3 bg-slate-700 rounded-md">
                          <textarea placeholder="Añadir comentario..." rows={3} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(e.currentTarget.value); e.currentTarget.value = ''; }}} className="w-full bg-slate-800 p-2 text-sm rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-sky-500"></textarea>
                      </div>
                  )}
              </div>
          </aside>
        </main>
        
        <footer className="flex items-center justify-between p-2 border-t border-slate-800 flex-shrink-0 text-sm text-gray-400">
            <span>Palabras: {wordCount}</span>
            <SyncStatusIndicator status={syncStatus} />
        </footer>
      </div>
      {isPublishModalOpen && (
        <PublishModal 
            onClose={() => setIsPublishModalOpen(false)} 
            onConfirm={(isScheduled, date) => {
                const message = isScheduled ? `Publicación programada para: ${date}` : 'Documento publicado con éxito.';
                showToast(message, 3000, <CheckIcon className="w-5 h-5 text-green-400"/>);
                setIsPublishModalOpen(false);
            }}
        />
      )}
    </div>
  );
};

export default EditorPlusModal;