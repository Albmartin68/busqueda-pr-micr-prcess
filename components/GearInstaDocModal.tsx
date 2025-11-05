import React, { useState, useEffect, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { GearIcon } from './icons/GearIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { analyzeRepository, translateFullDocument } from '../services/geminiService';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { ARGOS_LANGUAGES } from '../constants';

interface TechnicalDocGeneratorModalProps {
  onClose: () => void;
}

type Stage = 'config' | 'processing' | 'complete' | 'error';

// Define the analysis steps that correspond to the "sub-gears"
const ANALYSIS_STEPS = [
  { id: 'overview', title: 'Visión General y Arquitectura', prompt: 'Provide a high-level technical overview of the project. Describe its purpose, the main technologies used, and infer its software architecture (e.g., monolith, microservices, serverless). Create a summary of its likely development history based on common commit patterns.' },
  { id: 'errors', title: 'Apéndice de Errores Potenciales', prompt: 'Based on the repository\'s code and dependencies, identify potential common error types or edge cases developers should be aware of. Present this as a list of potential issues in a Markdown table.' },
  { id: 'metrics', title: 'Métricas Clave y Observabilidad', prompt: 'For a project like this, what would be the most important performance or health metrics to monitor? Suggest some key indicators (e.g., API Latency, Error Rate) and explain their importance.' },
  { id: 'adr', title: 'Decisiones de Arquitectura (ADR)', prompt: 'Assuming this repository follows good architectural practices, describe some likely Architectural Decision Records (ADRs) that would exist. For example, the choice of a framework, a database, or a state management library.' },
];

const TechnicalDocGeneratorModal: React.FC<TechnicalDocGeneratorModalProps> = ({ onClose }) => {
  const [stage, setStage] = useState<Stage>('config');
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/google-gemini/generative-ai-docs');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Content State
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [translatedReportContent, setTranslatedReportContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>(ARGOS_LANGUAGES[1].value); // Default to English
  
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleGenerate = useCallback(async () => {
    if (!repoUrl.trim() || !/https?:\/\/github\.com\/[\w-]+\/[\w-.]+/.test(repoUrl)) {
        setStage('error');
        setErrorMessage('Por favor, ingrese una URL de repositorio de GitHub válida.');
        return;
    }

    setIsLoading(true);
    setStage('processing');
    setReportContent(null);
    setTranslatedReportContent(null);
    setErrorMessage('');
    
    try {
        const analysisPromises = ANALYSIS_STEPS.map(async (step) => {
            setProcessingMessage(`Analizando: ${step.title}...`);
            const content = await analyzeRepository(repoUrl, step.prompt);
            return `## ${step.title}\n\n${content}`;
        });

        setProcessingMessage('Iniciando análisis concurrente del repositorio...');
        const sections = await Promise.all(analysisPromises);

        setProcessingMessage('Ensamblando documento final...');
        const finalReport = `# Análisis Técnico del Repositorio: ${repoUrl.split('/').slice(-2).join('/')}\n\n**Generado por el Generador de Documentos Técnicos el ${new Date().toLocaleString()}**\n\n---\n\n${sections.join('\n\n---\n\n')}`;
        
        setReportContent(finalReport);
        setStage('complete');
    } catch (error) {
        console.error("Error generating technical document:", error);
        setStage('error');
        setErrorMessage(error instanceof Error ? error.message : 'Ocurrió un error desconocido durante el análisis.');
    } finally {
        setIsLoading(false);
    }
  }, [repoUrl]);

  const handleTranslate = async () => {
    if (!reportContent) return;
    setIsTranslating(true);
    setTranslatedReportContent(null);
    try {
        const translated = await translateFullDocument(reportContent, targetLanguage);
        setTranslatedReportContent(translated);
    } catch (error) {
        setStage('error');
        setErrorMessage(error instanceof Error ? error.message : 'Ocurrió un error al traducir.');
    } finally {
        setIsTranslating(false);
    }
  };

  const handleShowOriginal = () => {
    setTranslatedReportContent(null);
  };
  
  const contentToDisplay = translatedReportContent ?? reportContent;
  
  const handleCopy = () => {
    if (!contentToDisplay) return;
    navigator.clipboard.writeText(contentToDisplay).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleDownload = () => {
    if (!contentToDisplay) return;
    const blob = new Blob([contentToDisplay], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'document';
    const langSuffix = translatedReportContent ? `_${targetLanguage}` : '';
    a.download = `DocTecnico-${repoName}${langSuffix}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleReset = () => {
    setStage('config');
    setReportContent(null);
    setTranslatedReportContent(null);
    setErrorMessage('');
    setIsLoading(false);
    setIsTranslating(false);
  };

  const renderConfig = () => (
    <div className="p-8 flex flex-col items-center justify-center text-center h-full">
        <h3 className="text-2xl font-bold text-white mb-4">Analizar Repositorio</h3>
        <p className="text-gray-400 max-w-md mb-8">Ingrese la URL de un repositorio público de GitHub para generar automáticamente una memoria técnica.</p>
        <div className="w-full max-w-lg space-y-4">
            <input 
                type="text" 
                placeholder="URL del Repositorio Git (ej: https://github.com/user/repo)" 
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
            />
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="mt-8 px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
            {isLoading ? 'Analizando...' : 'Generar Documento'}
        </button>
    </div>
  );

  const renderProcessing = () => (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <SpinnerIcon className="w-12 h-12 text-sky-400 mb-6"/>
        <h3 className="text-2xl font-bold text-white mb-4">Generando Documento...</h3>
        <p className="text-sky-300 font-mono">{processingMessage}</p>
        <p className="text-gray-500 mt-2 text-sm">Este proceso puede tardar unos momentos mientras la IA analiza el repositorio.</p>
    </div>
  );
  
  const renderComplete = () => (
    <div className="p-4 h-full flex flex-col">
        <div className="flex-shrink-0 mb-4 flex justify-between items-center flex-wrap gap-4">
             <h3 className="text-xl font-bold text-white">Documento Generado Exitosamente</h3>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-2 pr-8 text-sm focus:ring-sky-500 focus:border-sky-500 appearance-none"
                    >
                        {ARGOS_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                    </select>
                    <button onClick={handleTranslate} disabled={isTranslating} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-sky-600 hover:bg-sky-500 disabled:bg-slate-500 disabled:cursor-wait">
                        {isTranslating ? <SpinnerIcon className="w-4 h-4" /> : <TranslateIcon className="w-4 h-4" />}
                        {isTranslating ? 'Traduciendo...' : 'Traducir'}
                    </button>
                    {translatedReportContent && (
                        <button onClick={handleShowOriginal} className="px-3 py-1.5 text-sm rounded-md bg-slate-600 hover:bg-slate-500">
                           Ver Original
                        </button>
                    )}
                </div>
                 <div className="h-6 w-px bg-slate-600 mx-1"></div>
                <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {isCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}
                    {isCopied ? 'Copiado' : 'Copiar'}
                </button>
                 <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-emerald-700 hover:bg-emerald-600"><DownloadIcon className="w-4 h-4"/> Descargar .md</button>
             </div>
        </div>
        <div className="flex-grow bg-slate-800/70 border border-slate-700 rounded-md overflow-y-auto">
            <textarea
                readOnly
                value={contentToDisplay || ''}
                className="w-full h-full bg-transparent p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none"
            />
        </div>
        <div className="text-center mt-4 flex-shrink-0">
            <button onClick={handleReset} className="flex items-center gap-2 mx-auto px-6 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-lg transition-colors text-sm">
                <RefreshIcon className="w-4 h-4"/>
                Analizar Otro Repositorio
            </button>
        </div>
    </div>
  );

  const renderError = () => (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <XIcon className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Error en el Análisis</h3>
        <p className="text-red-300 bg-red-900/50 p-3 rounded-md max-w-lg">{errorMessage}</p>
        <button onClick={handleReset} className="mt-6 px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg">
            Intentar de Nuevo
        </button>
    </div>
  );


  const renderContent = () => {
    switch (stage) {
      case 'processing': return renderProcessing();
      case 'complete': return renderComplete();
      case 'error': return renderError();
      case 'config':
      default:
        return renderConfig();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden m-4" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <GearIcon className="w-6 h-6 text-sky-400" />
            Generador de Documentos Técnicos
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-grow overflow-hidden relative">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TechnicalDocGeneratorModal;