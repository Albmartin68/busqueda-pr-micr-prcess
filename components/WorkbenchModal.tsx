import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ImportIcon } from './icons/ImportIcon';
import { ARGOS_LANGUAGES } from '../constants';

const WORKFLOW_STEPS = [
  { step: "Mesa de Trabajo", tool: "Gestor de Carpeta Segura", params: { path: "~/VIJC/inbox", ext: ["pdf", "docx"], encryption: "AES-256" }, next_trigger: "Análisis e Indexación" },
  { step: "Análisis e Indexación", tool: "Enjambre de Engranajes Analizadores (EEA)", params: { model: "multilingual-e5-large-onnx", cache: "Índice Semántico Local (ChromaDB)", meta_rules: { pais: "regex_pais", articulo: "regex_art", tema: "NLP local (spaCy, transformers)" } }, next_trigger: "Poblar Biblioteca Virtual" },
  { 
    step: "Poblar Biblioteca Virtual", 
    tool: "Índice de Metadatos", 
    params: { 
      index_id: "<auto_uuid>",
      query_ref: "<user_input>",
      indexed_metadata: {
        countries: ["USA", "DEU", "FRA"],
        languages: ["en", "de", "fr"],
        document_types: ["PDF", "DOCX"],
        key_themes: ["protección", "niñez", "adopción", "educación"],
        source_files: ["<file_list>"]
      } 
    }, 
    next_trigger: "Traducción" 
  },
  { step: "Traducción", tool: "Enjambre de Traducción", params: { source_data: "Biblioteca Virtual (key_themes, snippets)", target_lang: "<user_lang>", cache: "~/.vijc/translation_cache", engine: "offline_argos" }, next_trigger: "Búsqueda Comparativa" },
  { step: "Búsqueda Comparativa", tool: "Buscador Interno Comparativo (BIC)", params: { query_source: "Biblioteca Virtual (query_ref)", top_k: 5, umbral: 0.78, output: "flash_queue" }, next_trigger: "Generar Flashcards" },
  { step: "Generar Flashcards", tool: "Generador de Flashcards de Comparación", params: { source_context: "Resultados de Búsqueda Comparativa (vía Biblioteca)", template: "pais-articulo-tema-similitud-diferencia", ui: "UI Web Local (React)" }, next_trigger: "Visualizar Cita" },
  { step: "Visualizar Cita", tool: "Visor de Documentos (PDF.js)", params: { file_path: "<path_from_card>", page: "<int>", highlight: "coords|regex", shade: "yellow@20%" }, next_trigger: "Crear Cita" },
  { step: "Crear Cita", tool: "Extractor de Citas", params: { source: "Visor de Documentos", auto_meta: true, note_prompt: "optional" }, next_trigger: "Editar Ensayo" },
  { step: "Editar Ensayo", tool: "Ventana de Edición (Slate.js)", params: { doc_id: "auto_uuid", mode: "append", exportable: true }, next_trigger: "Exportar Documento" },
  { step: "Exportar Documento", tool: "Exportador (Pandoc)", params: { format: ["pdf", "docx", "md"], style: "apa" }, next_trigger: "END" },
];

interface WorkbenchModalProps {
  onClose: () => void;
}

const WorkbenchModal: React.FC<WorkbenchModalProps> = ({ onClose }) => {
  const [state, setState] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [secureFolderFiles, setSecureFolderFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for interactive inputs
  const [userQuery, setUserQuery] = useState('');
  const [targetLang, setTargetLang] = useState(ARGOS_LANGUAGES[0].value);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleRunOrNext = () => {
    if (state < WORKFLOW_STEPS.length) {
      setState(prevState => prevState + 1);
    }
  };

  const handleReset = () => {
    setState(0);
    setSecureFolderFiles([]);
    setUserQuery('');
    setTargetLang(ARGOS_LANGUAGES[0].value);
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSecureFolderFiles(prevFiles => {
        // FIX: Explicitly type 'f' as File to resolve 'Property 'name' does not exist on type 'unknown'' error.
        const existingFileNames = new Set(prevFiles.map((f: File) => f.name));
        const uniqueNewFiles = newFiles.filter((f: File) => !existingFileNames.has(f.name));
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
  };

  const currentStepData = state > 0 ? WORKFLOW_STEPS[state - 1] : null;
  
  // Create a deep copy to avoid mutating the original constant and inject user values
  const processedStepData = currentStepData ? JSON.parse(JSON.stringify(currentStepData)) : null;
  if (processedStepData) {
      if (processedStepData.step === "Traducción") {
          processedStepData.params.target_lang = targetLang;
      }
      if (processedStepData.step === "Búsqueda Comparativa") {
          processedStepData.params.query_source = `Biblioteca Virtual (query_ref: "${userQuery || 'N/A'}")`;
      }
      if (processedStepData.step === "Poblar Biblioteca Virtual") {
        processedStepData.params.query_ref = userQuery || "<user_input>";
        processedStepData.params.indexed_metadata.source_files = secureFolderFiles.map(f => f.name);
        processedStepData.params.index_id = `lib-entry-${new Date().getTime()}`; // simulate auto_uuid
      }
  }

  const outputJson = processedStepData ? { state, output: processedStepData } : null;
  const jsonString = outputJson ? JSON.stringify(outputJson, null, 2) : '';

  const isRunning = state > 0;
  const isFinished = state > 0 && state >= WORKFLOW_STEPS.length;
  const canStart = secureFolderFiles.length > 0;
  
  // Logic for enabling/disabling the Next button based on required inputs
  const nextStep = state < WORKFLOW_STEPS.length ? WORKFLOW_STEPS[state] : null;
  let isNextStepReady = true;
  let nextButtonTitle = "";

  if (nextStep) {
    if (nextStep.step === 'Poblar Biblioteca Virtual' && !userQuery.trim()) {
        isNextStepReady = false;
        nextButtonTitle = "Por favor, complete la entrada requerida para el siguiente paso";
    }
  }

  if (!canStart) {
      nextButtonTitle = "Debe importar al menos un archivo para comenzar";
  }

  const renderRequiredInput = () => {
    if (isFinished || !isRunning) return null;
    
    const nextStepToExecute = state < WORKFLOW_STEPS.length ? WORKFLOW_STEPS[state] : null;
    if (!nextStepToExecute) return null;

    let inputElement = null;

    if (nextStepToExecute.step === "Traducción") {
        inputElement = (
            <>
                <label htmlFor="target_lang" className="block text-sm font-medium text-gray-400 mb-1">Idioma de Destino</label>
                <select 
                    id="target_lang"
                    value={targetLang} 
                    onChange={e => setTargetLang(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
                >
                    {ARGOS_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
            </>
        );
    } else if (nextStepToExecute.step === "Poblar Biblioteca Virtual") {
        inputElement = (
            <>
                <label htmlFor="user_query" className="block text-sm font-medium text-gray-400 mb-1">Consulta de Búsqueda (para indexar)</label>
                <input 
                    id="user_query"
                    type="text" 
                    value={userQuery} 
                    onChange={e => setUserQuery(e.target.value)} 
                    placeholder="Ingrese la consulta para asociar con estos archivos..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
                />
            </>
        );
    }
    
    if (!inputElement) return null;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2 text-sky-300">Entrada Requerida para: <span className="font-bold">{nextStepToExecute.step}</span></h3>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {inputElement}
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden m-4" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <WorkbenchIcon className="w-6 h-6 text-sky-400" />
            Mesa de Trabajo
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"><XIcon className="w-5 h-5"/></button>
        </header>

        <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.docx"
        />

        <div className="p-4 flex-grow overflow-y-auto flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200">Carpeta Segura Interna</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 min-h-[120px] max-h-[200px] overflow-y-auto">
                {secureFolderFiles.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-gray-300">
                    {/* FIX: Explicitly type 'file' to avoid potential type inference errors on 'file.name' and 'file.size'. */}
                    {secureFolderFiles.map((file: File) => (
                        <li key={file.name} className="text-sm">
                        {file.name} <span className="text-xs text-gray-500">- ({(file.size / 1024).toFixed(2)} KB)</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center">
                    <p>Importe los archivos que se procesarán.<br/> El flujo de trabajo no comenzará hasta que se agregue al menos un archivo.</p>
                    </div>
                )}
                </div>
            </div>
            
            {renderRequiredInput()}

            <div className="overflow-x-auto p-2">
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                {WORKFLOW_STEPS.map((step, index) => (
                    <React.Fragment key={step.step}>
                    <div className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 ${
                        state === index + 1 ? 'bg-sky-800 border-sky-500 text-white' : 
                        state > index + 1 ? 'bg-slate-700 border-slate-600 text-gray-300' :
                        'bg-slate-800 border-slate-700 text-gray-500'
                    }`}>
                        {step.step}
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 && <div className="text-gray-600 font-mono mx-1">&rarr;</div>}
                    </React.Fragment>
                ))}
                </div>
            </div>

            <div className="flex-grow bg-slate-800/50 rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Salida del Orquestador</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono bg-slate-700 px-2 py-1 rounded">ESTADO: {state}</span>
                        {outputJson && (
                            <button onClick={() => handleCopy(jsonString)} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                {isCopied ? <CheckIcon className="w-3 h-3"/> : <ClipboardIcon className="w-3 h-3"/>}
                                {isCopied ? 'Copiado' : 'Copiar JSON'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-grow bg-black/30 rounded-md overflow-auto">
                {outputJson ? (
                    <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">{jsonString}</pre>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Importe archivos y presione "RUN" para iniciar la cadena.</p>
                    </div>
                )}
                </div>
            </div>
        </div>

        <footer className="flex items-center justify-between p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-teal-600 hover:bg-teal-500 text-white"
            >
                <ImportIcon className="w-5 h-5"/>
                Importar a Carpeta Segura
            </button>
            <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-slate-700 hover:bg-slate-600 text-gray-200"
            >
                <RefreshIcon className="w-5 h-5"/>
                Reiniciar
            </button>
          </div>
          <button
            onClick={handleRunOrNext}
            disabled={isFinished || !canStart || (isRunning && !isNextStepReady)}
            title={nextButtonTitle}
            className="px-8 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-sky-600 hover:bg-sky-500 text-white disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {!isRunning ? "RUN" : isFinished ? "Finalizado" : `Siguiente: ${currentStepData?.next_trigger}`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WorkbenchModal;