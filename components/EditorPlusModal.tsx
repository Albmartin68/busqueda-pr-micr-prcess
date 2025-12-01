
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
import { GearIcon } from './icons/GearIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { assetService } from '../services/editorPlus/assetService';
import { renderService } from '../services/editorPlus/renderService';
import { docService } from '../services/editorPlus/docService';
import { generateCustomSummary } from '../services/geminiService';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import PublishModal from './PublishModal';
import EditorSettingsModal, { TEMPLATES } from './EditorSettingsModal';
import { SummarySettings, FormatSettings } from '../types';
import { ThesisIcon } from './icons/ThesisIcon';
import { DocIcon } from './icons/FileIcons';

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
export interface AuditReport {
    id: string;
    timestamp: string;
    content: string;
}
export interface SummaryReport {
    id: string;
    timestamp: string;
    content: string;
    type: string;
}

export type CitationStyle = 'APA' | 'MLA' | 'Chicago';
type SyncStatus = 'synced' | 'saving' | 'edited' | 'offline';

// Declare global PDF lib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// --- ADVANCED ANALYSIS SYSTEM PROMPT ---
const ADVANCED_ANALYSIS_SYSTEM_PROMPT = `
Actúa como un Sistema de Análisis y Procesamiento Documental Multimodal Avanzado.

Tu Objetivo Principal: Ingestar, procesar y sintetizar información de cualquier formato de archivo universal (PDF, DOCX, XLSX, TXT, EPUB, PPTX, HTML), independientemente de si el contenido es texto nativo, manuscrito, escaneado o visual.

Instrucciones de Procesamiento por Tipo de Contenido:

1. **Texto Nativo y Estructura:** Lee y comprende la jerarquía del documento (títulos, subtítulos, notas al pie). Mantén la coherencia lógica del argumento o narrativa.

2. **Archivos Escaneados (OCR):** Si detectas páginas escaneadas o imágenes con texto, asume que se ha aplicado reconocimiento óptico. Tu tarea es corregir posibles errores de lectura (typos, incoherencias) basados en el contexto para transcribir el contenido con precisión.

3. **Hojas de Cálculo y Tablas (Excel/CSV):** No te limites a leer las celdas. Analiza las relaciones entre filas y columnas. Identifica tendencias, picos, caídas y totales importantes en los datos numéricos presentados en el texto.

4. **Elementos Visuales (Gráficos, Diagramas e Imágenes):**
   - Para Gráficos: Interpreta qué representan los ejes X/Y y cuál es la conclusión o "insight" principal que el gráfico intenta comunicar basado en su descripción textual o datos.
   - Para Imágenes/Fotos: Integra la descripción del contenido visual relevante para el contexto.

Instrucciones para la Generación del Resumen:
- **Síntesis Integradora:** No separes el texto de las imágenes. Integra la información visual dentro de la narrativa (ej. "Como se observa en el gráfico de ventas de la página 3, hubo un aumento del 20%...").
- **Puntos Clave:** Enumera los 5-7 hallazgos o ideas más críticas del documento.
- **Detección de Anomalías:** Si encontraste datos en tablas o gráficos que contradicen el texto, señálalo explícitamente.
- **Formato de Salida:** Utiliza Markdown para estructurar el resumen (Negritas para énfasis, Bullet points para listas).
`;

// --- STRATEGIC AUDIT PROMPT ---
const STRATEGIC_AUDIT_PROMPT = `
# ROL: EDITOR JEFE DE ANÁLISIS ESTRATÉGICO

**CONTEXTO:**
Estás actuando como un auditor de contenido crítico. Tienes ante ti un [DOCUMENTO BASE] real proporcionado por el usuario (el contenido se adjunta a continuación).
**TU MISIÓN:** No es imaginar ni simular. Es ANALIZAR el texto específico que recibes. Si el texto es corto, incompleto o vago, tu análisis debe reflejar eso explícitamente y señalarlo como una deficiencia.

**INSTRUCCIONES DE AUDITORÍA:**

1.  **Análisis de "Cajas Negras":**
    - Busca en el texto provisto afirmaciones de hechos importantes que carezcan de explicación causal.
    - Cita textualmente la frase del documento y cuestiona: "¿Qué mecanismo causal falta aquí?".

2.  **Actores Ausentes:**
    - Basado ÚNICAMENTE en la lógica de los eventos descritos en el texto, identifica quiénes deberían estar mencionados y no lo están.

3.  **Evaluación de Calidad:**
    - Evalúa la densidad informativa del texto real. ¿Es un texto rico en datos o puramente retórico?
    - Califica la profundidad del 1 al 10 basándote solo en la evidencia presente.

---

## OUTPUT REQUERIDO (Estructura Markdown)

### 1. Diagnóstico del Documento Base
*(Evalúa la calidad del texto proporcionado. Sé honesto y directo.)*

### 2. Brechas de Información Detectadas
*   **Brecha 1:** [Descripción del vacío específico en el texto]
*   **Brecha 2:** [Descripción del vacío específico en el texto]
*   **Brecha 3:** [Descripción del vacío específico en el texto]

### 3. Hoja de Ruta para Potenciación
*   **Investigar:** [Tema específico externo necesario para llenar los vacíos]
*   **Verificar:** [Dato del texto que requiere confirmación externa]

**ADVERTENCIA FINAL:** Tu análisis debe estar estrictamente anclado al texto proporcionado. No hables de generalidades. Habla de ESTE documento.
`;

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Strategic Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string>('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);

  // Summary State
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryReports, setSummaryReports] = useState<SummaryReport[]>([]);

  // Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Cloud-connected state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Settings State
  const [summarySettings, setSummarySettings] = useState<SummarySettings>({
      template: 'academic',
      customConfig: { focus: '', tone: 'Formal', length: '', audience: '' }
  });
  const [formatSettings, setFormatSettings] = useState<FormatSettings>({
      standard: 'APA7',
      fontFamily: 'Times New Roman',
      fontSize: '12pt',
      lineHeight: '2.0',
      margins: '2.54cm',
      citationStyle: '(Autor, Año)'
  });
  
  // Sidebar Folders State
  const [openFolders, setOpenFolders] = useState({
      baseDoc: true,
      audits: true,
      summaries: true,
      assets: false,
      comments: true
  });

  // Apply default styles on mount
  useEffect(() => {
      if (editorRef.current) {
          applyFormatStyles(formatSettings);
      }
  }, []);

  const applyFormatStyles = (settings: FormatSettings) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      editor.style.fontFamily = settings.fontFamily;
      editor.style.fontSize = settings.fontSize;
      editor.style.lineHeight = settings.lineHeight;
      editor.style.padding = settings.margins;
  };

  const handleApplySettings = (newSummary: SummarySettings, newFormat: FormatSettings) => {
      setSummarySettings(newSummary);
      setFormatSettings(newFormat);
      applyFormatStyles(newFormat);
      showToast(`Ajustes aplicados: ${newFormat.standard}`, 2000, <CheckIcon className="w-5 h-5 text-green-400"/>);
  };
  
  // File Reading Logic
  const readFileContent = async (file: File): Promise<string> => {
      // PDF Parsing logic using PDF.js
      if (file.type === 'application/pdf') {
          try {
              if (!window.pdfjsLib) {
                   throw new Error("La librería PDF no está inicializada.");
              }
              
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
              let fullText = '';
              
              for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items.map((item: any) => item.str).join(' ');
                  fullText += pageText + '\n\n';
              }
              
              if (!fullText.trim()) {
                  return "Advertencia: Se detectó un PDF pero no se pudo extraer texto. Posiblemente sea una imagen escaneada sin capa de texto (requiere OCR).";
              }
              
              return fullText;
          } catch (e) {
              console.error("PDF extraction error:", e);
              throw new Error("Fallo al leer el PDF. Asegúrese de que el archivo es válido.");
          }
      } 
      
      // Image Processing (OCR simulation via Gemini Vision if available or assetService)
      if (file.type.startsWith('image/')) {
         try {
             return await assetService.extractTextFromImage(file);
         } catch (e) {
             throw new Error("Fallo al realizar OCR en la imagen.");
         }
      }
      
      // Standard Text Reading
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(new Error("Error al leer el archivo de texto."));
          reader.readAsText(file);
      });
  };

  const handlePreviewBaseDoc = async () => {
    if (!summarySettings.sourceFile) return;

    setIsPreviewLoading(true);
    try {
        const text = await readFileContent(summarySettings.sourceFile);
        setPreviewContent(text);
        setIsPreviewModalOpen(true);
    } catch (e) {
        showToast("Error al abrir vista previa.", 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    } finally {
        setIsPreviewLoading(false);
    }
  };

  const handleGenerateSummary = async (settings: SummarySettings) => {
    if (!settings.sourceFile) {
        showToast("Error: No se ha seleccionado un archivo fuente.", 3000, <XIcon className="w-5 h-5 text-red-400"/>);
        return;
    }

    setSummarySettings(settings); // Update local state
    setIsGeneratingSummary(true);
    setActiveSidebarTab('resumen'); 
    showToast("Ingestando y procesando documento...", 0);

    try {
        const text = await readFileContent(settings.sourceFile);
        if (!text || text.length < 50) {
             throw new Error("El documento parece estar vacío o no se pudo extraer texto legible.");
        }

        showToast("Sintetizando análisis multimodal...", 0);

        // Get specific template instruction
        let userPreferencePrompt = TEMPLATES.find(t => t.id === settings.template)?.prompt || "Genera un resumen detallado.";
        
        if (settings.template === 'personalized' && settings.customConfig) {
             userPreferencePrompt = `
                **PREFERENCIAS DE USUARIO (Personalizado):**
                - Enfoque: ${settings.customConfig.focus}
                - Audiencia: ${settings.customConfig.audience}
                - Tono: ${settings.customConfig.tone}
                - Extensión Objetivo: ${settings.customConfig.length}
             `;
        }

        // Composite Prompt: Advanced System Persona + User Settings + Content
        const compositePrompt = `
            ${ADVANCED_ANALYSIS_SYSTEM_PROMPT}

            ---
            **INSTRUCCIONES ESPECÍFICAS DE ESTA SESIÓN:**
            
            1. **Aplicación de Plantilla:** Aunque eres el Sistema Avanzado, debes adaptar tu salida al siguiente estilo solicitado por el usuario:
            ${userPreferencePrompt}

            2. **Estándar de Formato:** El resumen debe respetar normas de citación y estilo "${formatSettings.standard}" donde aplique.

            ---
            **CONTENIDO DEL DOCUMENTO INGESTADO:**
        `;

        const summary = await generateCustomSummary(text, compositePrompt);
        setSummaryContent(summary);
        
        const newReport: SummaryReport = {
            id: `sum-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: summary,
            type: settings.template === 'personalized' ? 'Personalizado' : TEMPLATES.find(t => t.id === settings.template)?.label || 'Resumen'
        };
        setSummaryReports(prev => [newReport, ...prev]);

        showToast("Análisis completado exitosamente.", 3000, <CheckIcon className="w-5 h-5 text-green-400"/>);

    } catch (e) {
        console.error("Summary generation failed", e);
        const errorMsg = e instanceof Error ? e.message : "Error desconocido";
        setSummaryContent(`Hubo un error al generar el resumen: ${errorMsg}.`);
        showToast("Error al generar resumen.", 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    } finally {
        setIsGeneratingSummary(false);
    }
  };

  const handleRunStrategicAudit = async () => {
      // 1. Strict Requirement: Base Document must exist
      if (!summarySettings.sourceFile) {
          const errorCardHtml = `
            <div class="flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div class="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center border border-amber-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-white mb-2">Documento Base No Detectado</h3>
                    <p class="text-gray-400 max-w-md mx-auto">
                        Para realizar una Auditoría Estratégica, el "Editor Jefe" necesita analizar un archivo fuente real. Actualmente no hay ningún documento cargado.
                    </p>
                </div>
                
                <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-4 text-left shadow-lg">
                    <h4 class="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">Sugerencia para resolver:</h4>
                    <ol class="list-decimal list-inside space-y-3 text-sm text-gray-300">
                        <li>Ubica el botón de <strong class="text-white">Ajustes</strong> (icono de engranaje) en la columna derecha.</li>
                        <li>En la pestaña <strong class="text-white">Resumen con IA</strong>, sube tu archivo (PDF, DOCX).</li>
                        <li>Cierra los ajustes y vuelve a ejecutar la Auditoría.</li>
                    </ol>
                </div>
            </div>
          `;
          
          setAuditResult(errorCardHtml);
          setShowAuditModal(true);
          return;
      }

      setIsAuditing(true);
      showToast("Inicializando Auditoría Estratégica...", 0);

      try {
          // 2. Read ACTUAL content
          const content = await readFileContent(summarySettings.sourceFile);

          if (!content || content.trim().length < 50) {
              throw new Error("El documento base parece estar vacío o no contiene texto legible.");
          }

          showToast("Analizando documento base...", 0);
          
          // 3. Generate using Base Doc Content + Strict Prompt
          const result = await generateCustomSummary(content, STRATEGIC_AUDIT_PROMPT);
          
          if (!result) throw new Error("La IA no devolvió resultados.");

          setAuditResult(result);
          setShowAuditModal(true);
          
          const newReport: AuditReport = {
              id: `audit-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: result
          };
          setAuditReports(prev => [newReport, ...prev]);

          showToast("Auditoría finalizada con éxito.", 3000, <CheckIcon className="w-5 h-5 text-green-400"/>);
      } catch (e) {
          console.error("Strategic Audit Failed", e);
          const msg = e instanceof Error ? e.message : "Error desconocido.";
           const errorHtml = `
            <div class="p-6 text-center">
                <h3 class="text-xl font-bold text-red-400">Error de Procesamiento</h3>
                <p class="text-gray-300 mt-2">${msg}</p>
            </div>
          `;
          setAuditResult(errorHtml);
          setShowAuditModal(true);
      } finally {
          setIsAuditing(false);
      }
  };

  const downloadReport = (content: string, prefix: string) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prefix}_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const toggleFolder = (folder: keyof typeof openFolders) => {
      setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // --- EDITOR CORE ---
  const handleSave = useCallback(async () => {
    if (!editorRef.current || syncStatus === 'saving') return;
    setSyncStatus('saving');
    try {
        await docService.saveDocument('doc-1', editorRef.current.innerHTML);
        setSyncStatus('synced');
    } catch (e) {
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
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(handleSave, 2000);

  }, [handleSave]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateEditorState();
  };

  // --- ASSETS & COMMENTS ---
  const showToast = (message: string, duration = 3000, icon: React.ReactNode = <SpinnerIcon className="w-5 h-5" />) => {
    setToast({ show: true, message, icon });
    if (duration > 0) setTimeout(() => setToast({ show: false, message: '', icon: null }), duration);
  };

  const insertHtmlInEditor = (html: string) => {
    document.execCommand('insertHTML', false, '<p id="temp-insert-placeholder">&nbsp;</p>');
    const placeholder = editorRef.current?.querySelector('#temp-insert-placeholder');
    if (placeholder) placeholder.outerHTML = html;
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
            insertHtmlInEditor(assetService.createFigureHtml(asset.src, asset.name) + '<p>&nbsp;</p>');
            updateEditorState();
        }
        return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await processAndInsertImage(e.dataTransfer.files[0]);
    }
  }, [assets, processAndInsertImage, updateEditorState]);

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
  
  const handleAssetDragStart = (e: React.DragEvent, asset: Asset) => e.dataTransfer.setData('application/asset-id', asset.id);

  const handleOcrClick = async (asset: Asset) => {
    showToast('Extrayendo texto...', 0);
    try {
        const text = await assetService.extractTextFromImage(asset.file);
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado', 3000, <CheckIcon className="w-5 h-5 text-green-400"/>);
    } catch(e) {
        showToast('Error OCR', 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    }
  };
  
  const handleAddCitation = (author: string, year: string, title: string, style: CitationStyle) => {
    if (!author || !year || !title) return;
    const key = `${author.split(' ')[0]}${year}`;
    let inTextCitation = '';
    let fullReference = '';

    switch (style) {
        case 'APA': inTextCitation = `(${author}, ${year})`; fullReference = `${author} (${year}). *${title}*.`; break;
        case 'MLA': inTextCitation = `(${author})`; fullReference = `${author}. *${title}*.`; break;
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
        setOpenFolders(prev => ({ ...prev, comments: true }));
      } catch (e) {
        alert("Seleccione texto dentro de un solo bloque.");
      }
    }
  };

  const addComment = (text: string) => {
    if (text.trim() && activeCommentTarget) {
      setComments(prev => [...prev, { id: `c-${Date.now()}`, targetId: activeCommentTarget, text, author: 'Usuario', resolved: false }]);
      setActiveCommentTarget(null);
    }
  };

  const toggleResolveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };
  
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const targetId = target.getAttribute('href')!.substring(1);
      editorRef.current?.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (target.classList.contains('comment-highlight')) {
        setOpenFolders(prev => ({ ...prev, comments: true }));
        setTimeout(() => {
            document.querySelector(`[data-comment-for="${target.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  };
  
  const handleExportPDF = async () => {
    if (!editorRef.current) return;
    try {
        await renderService.exportToPdf(editorRef.current, (msg) => showToast(msg, 0));
        showToast('Descarga iniciada', 2000, <CheckIcon className="w-5 h-5 text-green-400"/>);
    } catch (err) {
        showToast('Error al exportar', 3000, <XIcon className="w-5 h-5 text-red-400"/>);
    }
  };

  const handleInsertSummary = () => {
      if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, `<blockquote>${summaryContent.replace(/\n/g, '<br/>')}</blockquote><p><br/></p>`);
          updateEditorState();
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4" onClick={onClose}>
      <input type="file" ref={fileInputRef} onChange={handleAddAsset} accept="image/*" multiple className="hidden" />
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3"><EditorPlusIcon className="w-6 h-6 text-sky-400" /> Editor Plus</h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-white">
                    <UploadCloudIcon className="w-5 h-5"/> Publicar
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white">
                    <DownloadIcon className="w-5 h-5" /> PDF
                </button>
                <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex overflow-hidden bg-slate-800">
          {/* Left Sidebar */}
          <aside className="w-80 bg-slate-900/50 p-4 border-r border-slate-700 flex-shrink-0 flex flex-col">
            <div className="flex-shrink-0 flex border-b border-slate-700 mb-4">
              {['Índice', 'Activos', 'Resumen'].map(tab => (
                <button key={tab} onClick={() => setActiveSidebarTab(tab.toLowerCase())}
                  className={`flex-1 py-2 text-sm font-semibold ${activeSidebarTab === tab.toLowerCase() ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            {activeSidebarTab === 'índice' && (
              <div className="flex flex-col h-full">
                <ul className="text-sm text-gray-400 space-y-2 overflow-y-auto flex-grow">
                  {headings.length > 0 ? headings.map(h => (
                    <li key={h.id} className="cursor-pointer hover:text-white truncate" onClick={() => editorRef.current?.querySelector(`#${h.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} title={h.text}>
                      {h.tagName === 'h1' && <span className="font-semibold">{h.text}</span>}
                      {h.tagName === 'h2' && <span className="pl-3">{h.text}</span>}
                      {h.tagName === 'h3' && <span className="pl-6 text-gray-500">{h.text}</span>}
                    </li>
                  )) : <li className="text-gray-500 italic">No hay encabezados.</li>}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-semibold text-sky-400 uppercase mb-2">Herramientas de Análisis</h4>
                    <button onClick={handleRunStrategicAudit} disabled={isAuditing} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-md transition-colors disabled:opacity-50">
                        {isAuditing ? <SpinnerIcon className="w-4 h-4" /> : <ThesisIcon className="w-4 h-4 text-amber-400" />}
                        {isAuditing ? 'Auditando...' : 'Auditoría Estratégica'}
                    </button>
                </div>
              </div>
            )}
            {activeSidebarTab === 'activos' && (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-grow">
                  {assets.map(asset => (
                    <div key={asset.id} className="relative group">
                        <img src={asset.src} alt={asset.name} title={asset.name} draggable="true" onDragStart={(e) => handleAssetDragStart(e, asset)} className="w-full h-16 object-cover rounded-md cursor-grab border-2 border-transparent group-hover:border-sky-400"/>
                        <div className="image-options"><button onClick={() => handleOcrClick(asset)} className="p-1 rounded-sm bg-slate-700/50 hover:bg-slate-600"><BookOpenIcon className="w-4 h-4 text-white"/></button></div>
                    </div>
                  ))}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 flex-shrink-0 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md"><FilePlusIcon className="w-4 h-4"/> Añadir Imagen</button>
              </div>
            )}
            {activeSidebarTab === 'resumen' && (
               <div className="flex flex-col h-full animate-fade-in">
                   {isGeneratingSummary ? (
                       <div className="flex flex-col items-center justify-center h-48 text-gray-400"><SpinnerIcon className="w-8 h-8 mb-2 text-sky-400"/><p>Procesamiento Multimodal...</p></div>
                   ) : summaryContent ? (
                       <>
                           <div className="bg-slate-800 p-3 rounded-md border border-slate-700 overflow-y-auto flex-grow text-gray-300 whitespace-pre-wrap text-xs">{summaryContent}</div>
                           <div className="mt-4 flex flex-col gap-2 flex-shrink-0">
                               <button onClick={handleInsertSummary} className="w-full py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-white text-sm font-semibold">Insertar</button>
                               <button onClick={() => navigator.clipboard.writeText(summaryContent)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white text-sm">Copiar</button>
                           </div>
                       </>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-center text-gray-500"><BookOpenIcon className="w-12 h-12 mb-3 opacity-20"/><p>No hay resumen.</p></div>
                   )}
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
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} title="Lista"><ListIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} title="Lista numerada"><ListOrderedIcon className="w-5 h-5" /></ToolbarButton>
              <div className="h-6 w-px bg-slate-600 mx-1"></div>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); const selection = window.getSelection(); if (selection && !selection.getRangeAt(0).collapsed) { selectionRangeRef.current = selection.getRangeAt(0).cloneRange(); setIsLinkModalOpen(true); } else { alert('Seleccione texto para enlazar.'); } }} title="Enlace interno"><LinkIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); const selection = window.getSelection(); if (selection && !selection.getRangeAt(0).collapsed) { selectionRangeRef.current = selection.getRangeAt(0).cloneRange(); setIsCitationModalOpen(true); } else { alert('Seleccione dónde insertar la cita.'); } }} title="Citar"><QuoteIcon className="w-5 h-5" /></ToolbarButton>
              <ToolbarButton onMouseDown={e => { e.preventDefault(); handleCommentButtonClick(); }} title="Comentar"><MessageSquareIcon className="w-5 h-5" /></ToolbarButton>
            </div>
            
            {/* Editable Area */}
            <div className="flex-grow overflow-y-auto p-4 relative" onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={handleEditorClick}>
              <div ref={editorRef} className="document-editor-page" contentEditable={true} onInput={updateEditorState} suppressContentEditableWarning={true}>
                  <p><br/></p>
                  {references.size > 0 && (
                  <div id="references-section" contentEditable="false" className="mt-12 pt-6 border-t border-slate-300">
                    <h2 style={{fontSize: '16pt', fontWeight: 'bold'}}>Referencias</h2>
                    {Array.from(references.values()).map((ref, i) => <p key={i} style={{fontSize: '11pt', margin: '0.5em 0'}}>{ref}</p>)}
                  </div>
                  )}
              </div>
              {isDragging && <div className="drag-over-overlay"><span>Soltar imagen para añadir</span></div>}
              <Toast {...toast} />
              
              {isLinkModalOpen && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center" onClick={() => setIsLinkModalOpen(false)}>
                  <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Enlazar a Encabezado</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {headings.length > 0 ? headings.map(h => (
                        <button key={h.id} onClick={() => { if (selectionRangeRef.current) { const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(selectionRangeRef.current); document.execCommand('createLink', false, `#${h.id}`); } setIsLinkModalOpen(false); updateEditorState(); }} className="w-full text-left p-2 rounded hover:bg-slate-700 transition-colors">
                          <span className={`font-semibold ${h.tagName === 'h2' ? 'pl-3' : ''} ${h.tagName === 'h3' ? 'pl-6' : ''}`}>{h.text}</span>
                        </button>
                      )) : <p className="text-gray-500">No hay encabezados para enlazar.</p>}
                    </div>
                  </div>
                </div>
              )}
              {isCitationModalOpen && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center" onClick={() => setIsCitationModalOpen(false)}>
                    <form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); handleAddCitation(data.get('author') as string, data.get('year') as string, data.get('title') as string, data.get('style') as CitationStyle); }} className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold">Añadir Citación</h3>
                        <input name="author" placeholder="Autor" required className="w-full bg-slate-700 p-2 rounded"/>
                        <input name="year" placeholder="Año" required className="w-full bg-slate-700 p-2 rounded"/>
                        <input name="title" placeholder="Título" required className="w-full bg-slate-700 p-2 rounded"/>
                        <div className="flex justify-end gap-2"><button type="submit" className="px-4 py-2 bg-sky-600 rounded">Insertar</button></div>
                    </form>
                 </div>
              )}
              {isSettingsModalOpen && <EditorSettingsModal onClose={() => setIsSettingsModalOpen(false)} currentSummarySettings={summarySettings} currentFormatSettings={formatSettings} onApplySettings={handleApplySettings} onGenerateSummary={handleGenerateSummary} />}
            </div>
          </div>
           {/* Right Sidebar */}
          <aside className="w-80 bg-slate-900/50 p-4 border-l border-slate-700 flex-shrink-0 flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-700 mb-4 pb-2">
                  <span className="text-sm font-semibold text-sky-400">Carpeta de Uso</span>
                  <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white"><GearIcon className="w-4 h-4"/></button>
              </div>

              <div className="overflow-y-auto flex-grow space-y-1">
                  {/* FOLDERS */}
                  <div className="border-b border-slate-700">
                    <button onClick={() => toggleFolder('baseDoc')} className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-2"><DocIcon className="w-4 h-4"/> Documento Base</div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openFolders.baseDoc ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFolders.baseDoc && (
                        <div className="p-2 bg-slate-900/30">
                            {summarySettings.sourceFile ? (
                                <div className="flex items-center justify-between gap-2 text-sm text-sky-300 bg-slate-800 p-2 rounded border border-slate-700 group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <DocIcon className="w-4 h-4 flex-shrink-0"/>
                                        <p className="truncate font-medium">{summarySettings.sourceFile.name}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePreviewBaseDoc(); }} 
                                        className="p-1 hover:bg-slate-700 rounded text-gray-400 hover:text-white transition-colors"
                                        title="Vista Previa"
                                    >
                                        <EyeIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ) : <p className="text-xs text-gray-500 italic p-1">No hay documento seleccionado.</p>}
                        </div>
                    )}
                  </div>

                  <div className="border-b border-slate-700">
                    <button onClick={() => toggleFolder('audits')} className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 hover:bg-slate-800 hover:text-amber-400 transition-colors">
                        <div className="flex items-center gap-2"><ThesisIcon className="w-4 h-4"/> Auditorías <span className="bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{auditReports.length}</span></div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openFolders.audits ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFolders.audits && (
                        <div className="p-2 bg-slate-900/30 space-y-2">
                             {auditReports.length > 0 ? auditReports.map(report => (
                                  <div key={report.id} className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between items-center group">
                                      <p className="text-xs text-gray-300 font-medium truncate">Auditoría {report.timestamp}</p>
                                      <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                                          <button onClick={() => downloadReport(report.content, 'Auditoria')} className="p-1 hover:bg-slate-600 rounded text-sky-400"><DownloadIcon className="w-3 h-3"/></button>
                                          <button onClick={() => { setAuditResult(report.content); setShowAuditModal(true); }} className="p-1 hover:bg-slate-600 rounded text-gray-400"><EyeIcon className="w-3 h-3"/></button>
                                      </div>
                                  </div>
                              )) : <p className="text-xs text-gray-500 italic p-1">Sin auditorías.</p>}
                        </div>
                    )}
                  </div>

                  <div className="border-b border-slate-700">
                    <button onClick={() => toggleFolder('summaries')} className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 hover:bg-slate-800 hover:text-purple-400 transition-colors">
                        <div className="flex items-center gap-2"><BookOpenIcon className="w-4 h-4"/> Resúmenes <span className="bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{summaryReports.length}</span></div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openFolders.summaries ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFolders.summaries && (
                        <div className="p-2 bg-slate-900/30 space-y-2">
                             {summaryReports.length > 0 ? summaryReports.map(report => (
                                  <div key={report.id} className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col gap-2 group">
                                      <div className="flex justify-between items-start">
                                          <div className="min-w-0">
                                              <p className="text-xs text-gray-300 font-bold truncate">{report.type}</p>
                                              <p className="text-[10px] text-gray-500">{report.timestamp}</p>
                                          </div>
                                          <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                                              <button onClick={() => downloadReport(report.content, 'Resumen')} className="p-1 hover:bg-slate-600 rounded text-sky-400"><DownloadIcon className="w-3 h-3"/></button>
                                              <button onClick={() => { setSummaryContent(report.content); setActiveSidebarTab('resumen'); }} className="p-1 hover:bg-slate-600 rounded text-gray-400"><EyeIcon className="w-3 h-3"/></button>
                                          </div>
                                      </div>
                                  </div>
                              )) : <p className="text-xs text-gray-500 italic p-1">Sin resúmenes.</p>}
                        </div>
                    )}
                  </div>
                  
                  <div className="border-b border-slate-700">
                    <button onClick={() => toggleFolder('assets')} className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 hover:bg-slate-800 hover:text-green-400 transition-colors">
                        <div className="flex items-center gap-2"><FilePlusIcon className="w-4 h-4"/> Activos <span className="bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{assets.length}</span></div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openFolders.assets ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFolders.assets && (
                        <div className="p-2 bg-slate-900/30">
                            {assets.length > 0 ? (
                                <ul className="space-y-1">
                                    {assets.map(asset => (
                                        <li key={asset.id} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white group">
                                            <img src={asset.src} alt="" className="w-5 h-5 rounded object-cover border border-slate-600"/>
                                            <span className="truncate flex-1">{asset.name}</span>
                                            <button onClick={() => {insertHtmlInEditor(assetService.createFigureHtml(asset.src, asset.name)); updateEditorState();}} className="text-gray-500 hover:text-green-400 opacity-0 group-hover:opacity-100">+</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-xs text-gray-500 italic p-1">Sin activos.</p>}
                        </div>
                    )}
                  </div>

                  <div className="border-b border-slate-700">
                    <button onClick={() => toggleFolder('comments')} className="w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 hover:bg-slate-800 hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-2"><MessageSquareIcon className="w-4 h-4"/> Comentarios <span className="bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{comments.filter(c => !c.resolved).length}</span></div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openFolders.comments ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFolders.comments && (
                        <div className="p-2 bg-slate-900/30 space-y-3">
                            {comments.map(comment => (
                              <div key={comment.id} data-comment-for={comment.targetId} onClick={() => editorRef.current?.querySelector(`#${comment.targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                  className={`p-2 rounded-md border-l-4 cursor-pointer transition-colors ${comment.resolved ? 'bg-slate-800 border-green-500 opacity-60' : 'bg-slate-800 border-amber-400 hover:bg-slate-700'}`}>
                                  <p className="text-xs text-gray-300 line-clamp-2">{comment.text}</p>
                                  <div className="text-[10px] text-gray-500 mt-1 flex justify-between items-center">
                                      <span>{comment.author}</span>
                                      <button onClick={(e) => { e.stopPropagation(); toggleResolveComment(comment.id); }} className="hover:text-white">{comment.resolved ? 'Reabrir' : 'Resolver'}</button>
                                  </div>
                              </div>
                            ))}
                            {comments.length === 0 && <p className="text-xs text-gray-500 italic p-1">No hay comentarios.</p>}
                            
                            {activeCommentTarget && (
                                <div className="p-2 bg-slate-700 rounded-md animate-fade-in mt-2">
                                    <textarea placeholder="Escribir comentario..." rows={3} autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(e.currentTarget.value); e.currentTarget.value = ''; }}} className="w-full bg-slate-800 p-2 text-xs rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 text-white"></textarea>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
              </div>
          </aside>
        </main>
        
        <footer className="flex items-center justify-between p-2 border-t border-slate-800 flex-shrink-0 text-sm text-gray-400">
            <span>Palabras: {wordCount}</span>
            <div className="flex items-center gap-2">{syncStatus === 'synced' ? <CheckIcon className="w-4 h-4 text-green-400"/> : <SpinnerIcon className="w-4 h-4"/>} <span>{syncStatus === 'synced' ? 'Sincronizado' : 'Guardando...'}</span></div>
        </footer>
      </div>
      {isPublishModalOpen && <PublishModal onClose={() => setIsPublishModalOpen(false)} onConfirm={() => { showToast('Publicado', 3000, <CheckIcon className="w-5 h-5 text-green-400"/>); setIsPublishModalOpen(false); }} />}

      {/* STRATEGIC AUDIT MODAL */}
      {showAuditModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]" onClick={() => setShowAuditModal(false)}>
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <ThesisIcon className="w-5 h-5 text-amber-400"/>
                          Resultado de Auditoría Estratégica
                      </h2>
                      <button onClick={() => setShowAuditModal(false)} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
                  </header>
                  <div className="p-6 overflow-y-auto bg-slate-800/50 flex-grow">
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                          {/* Safe rendering of HTML content including the Error Card */}
                          <div dangerouslySetInnerHTML={{ __html: auditResult.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^# (.*)/gm, '<h1 class="text-xl font-bold my-4 text-white">$1</h1>').replace(/^## (.*)/gm, '<h2 class="text-lg font-bold my-3 text-sky-400">$1</h2>').replace(/^\* (.*)/gm, '<li class="ml-4">$1</li>') }} />
                      </div>
                  </div>
                  <footer className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
                      <button onClick={() => { navigator.clipboard.writeText(auditResult); showToast("Copiado al portapapeles", 2000, <CheckIcon className="w-5 h-5 text-green-400"/>); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white flex items-center gap-2"><ClipboardIcon className="w-4 h-4"/> Copiar</button>
                      <button onClick={() => { insertHtmlInEditor(`<hr/><h3>Reporte de Auditoría</h3><pre style="background:#1e293b;padding:10px;border-radius:4px;white-space:pre-wrap;">${auditResult}</pre><p><br/></p>`); setShowAuditModal(false); }} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded text-sm text-white">Insertar al Final</button>
                  </footer>
              </div>
          </div>
      )}

      {/* PREVIEW BASE DOC MODAL */}
      {isPreviewModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80]" onClick={() => setIsPreviewModalOpen(false)}>
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden m-4" onClick={e => e.stopPropagation()}>
                  <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                      <h2 className="text-lg font-bold text-white flex items-center gap-3">
                          <EyeIcon className="w-5 h-5 text-sky-400"/>
                          Vista Previa: {summarySettings.sourceFile?.name}
                      </h2>
                      <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                          <XIcon className="w-6 h-6"/>
                      </button>
                  </header>
                  <div className="flex-grow overflow-y-auto p-8 bg-slate-800/50">
                      {isPreviewLoading ? (
                           <div className="flex flex-col items-center justify-center h-full">
                               <SpinnerIcon className="w-10 h-10 text-sky-400 mb-2"/>
                               <p className="text-gray-400">Cargando vista previa...</p>
                           </div>
                      ) : (
                          <div className="prose prose-invert max-w-none">
                              <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm">
                                  {previewContent}
                              </pre>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default EditorPlusModal;
