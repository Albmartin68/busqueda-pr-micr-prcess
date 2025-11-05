import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { GearIcon } from './icons/GearIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckIcon } from './icons/CheckIcon';
import {
  analyzeRepository,
  translateFullDocument,
  generateExecutiveSummary,
  generateRelatedWork,
  generateGlossary,
  generateAuditChecklist,
  generateAnalyticalIndex,
} from '../services/geminiService';
import { ThesisIcon } from './icons/ThesisIcon';
import { CodeCommitIcon } from './icons/CodeCommitIcon';
import { BugIcon } from './icons/BugIcon';
import { BuildIcon } from './icons/BuildIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { ARGOS_LANGUAGES } from '../constants';
import { TranslateIcon } from './icons/TranslateIcon';
import { RefreshIcon } from './icons/RefreshIcon';

const SECTIONS = [
  { id: 'project-overview', label: 'Resumen Ejecutivo y Visión General', icon: <ThesisIcon className="w-5 h-5"/>, topic: "Project executive summary, goals, and target audience." },
  { id: 'architecture', label: 'Análisis de Arquitectura', icon: <CodeCommitIcon className="w-5 h-5"/>, topic: "High-level software architecture, main components, and data flow." },
  { id: 'code-quality', label: 'Calidad del Código y Pruebas', icon: <BugIcon className="w-5 h-5"/>, topic: "Code quality standards, testing strategies, and static analysis findings." },
  { id: 'dependencies', label: 'Dependencias y Construcción', icon: <BuildIcon className="w-5 h-5"/>, topic: "Key dependencies, build process, and package management." },
  { id: 'deployment', label: 'Despliegue e Infraestructura', icon: <TerminalIcon className="w-5 h-5"/>, topic: "Deployment process, CI/CD pipeline, and required infrastructure." },
];

const DIDACTIC_FUNCTIONS = [
  { id: '', label: 'Seleccione una función...' },
  { id: 'summary', label: 'Resumen Ejecutivo', func: generateExecutiveSummary },
  { id: 'related-work', label: 'Trabajo Relacionado', func: generateRelatedWork },
  { id: 'glossary', label: 'Glosario Técnico', func: generateGlossary },
  { id: 'audit', label: 'Check-list de Auditoría', func: generateAuditChecklist },
  { id: 'index', label: 'Índice Analítico', func: generateAnalyticalIndex },
];

const TechnicalDocGeneratorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [didacticFormat, setDidacticFormat] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSectionToggle = (id: string) => {
    setSelectedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const isValidUrl = useMemo(() => {
    try {
      const url = new URL(repoUrl);
      return url.protocol === 'https:' && url.hostname === 'github.com';
    } catch (e) {
      return false;
    }
  }, [repoUrl]);

  const canGenerate = useMemo(() => {
    return isValidUrl && Object.values(selectedSections).some(v => v);
  }, [isValidUrl, selectedSections]);
  
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setGeneratedContent('');
    setTranslatedContent(null);
    setDidacticFormat('');
    setProgressMessage('Iniciando análisis...');

    const sectionsToGenerate = SECTIONS.filter(s => selectedSections[s.id]);
    const totalSections = sectionsToGenerate.length;
    let content = `# Documento Técnico para ${repoUrl}\n\n`;
    
    try {
      for (let i = 0; i < totalSections; i++) {
        const section = sectionsToGenerate[i];
        setProgressMessage(`Generando sección ${i + 1}/${totalSections}: ${section.label}...`);
        
        const sectionContent = await analyzeRepository(repoUrl, section.topic);
        
        content += `## ${section.label}\n\n`;
        content += `${sectionContent}\n\n`;
        
        setGeneratedContent(content); // Update preview as sections complete
      }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        content += `\n\n---\n\n**Error:** No se pudo generar una o más secciones. Razón: ${errorMessage}`;
        setGeneratedContent(content);
    } finally {
        setIsLoading(false);
        setProgressMessage('');
    }
  }, [canGenerate, repoUrl, selectedSections]);

  const handleUpdateDocument = useCallback(async () => {
    if (!didacticFormat || !generatedContent || !repoUrl) return;

    const selectedDidactic = DIDACTIC_FUNCTIONS.find(f => f.id === didacticFormat);
    if (!selectedDidactic || !selectedDidactic.func) return;

    setIsUpdating(true);
    setUpdateMessage(`Generando ${selectedDidactic.label}...`);

    try {
        let newSectionContent = '';
        if (didacticFormat === 'related-work' || didacticFormat === 'audit') {
            const func = selectedDidactic.func as (repoUrl: string, text: string) => Promise<string>;
            newSectionContent = await func(repoUrl, generatedContent);
        } else {
            const func = selectedDidactic.func as (text: string) => Promise<string>;
            newSectionContent = await func(generatedContent);
        }
        
        const newTotalContent = `${generatedContent}\n\n---\n\n### ${selectedDidactic.label}\n\n${newSectionContent}`;
        setGeneratedContent(newTotalContent);

        if (translatedContent) {
            const targetLangLabel = ARGOS_LANGUAGES.find(l => l.value === targetLanguage)?.label || targetLanguage;
            setUpdateMessage(`Retraduciendo documento actualizado a ${targetLangLabel}...`);
            const retranslatedResult = await translateFullDocument(newTotalContent, targetLanguage);
            setTranslatedContent(retranslatedResult);
        }
        
        setDidacticFormat('');
    } catch (error) {
        console.error("Failed to update document with didactic format:", error);
        alert("No se pudo agregar la sección seleccionada.");
    } finally {
        setIsUpdating(false);
        setUpdateMessage('');
    }
  }, [didacticFormat, generatedContent, repoUrl, translatedContent, targetLanguage]);

  const handleTranslate = useCallback(async () => {
    if (!generatedContent || !targetLanguage) return;

    setIsTranslating(true);
    try {
        const result = await translateFullDocument(generatedContent, targetLanguage);
        setTranslatedContent(result);
    } catch (error) {
        console.error("Translation failed", error);
        alert("La traducción ha fallado. Por favor, inténtelo de nuevo.");
    } finally {
        setIsTranslating(false);
    }
  }, [generatedContent, targetLanguage]);

  const contentToDisplay = useMemo(() => translatedContent ?? generatedContent, [translatedContent, generatedContent]);

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
    const link = document.createElement('a');
    const repoName = repoUrl.split('/').pop() || 'document';
    const langSuffix = translatedContent ? `_${targetLanguage}` : '';
    link.download = `technical_doc_${repoName}${langSuffix}.md`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <GearIcon className="w-6 h-6 text-sky-400"/>
                    Generador de Documentos Técnicos
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
                    <XIcon className="w-5 h-5"/>
                </button>
            </header>
            
            <main className="flex-grow flex overflow-hidden">
                {/* Left Panel: Controls */}
                <aside className="w-1/3 bg-slate-800/50 p-6 border-r border-slate-700 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <label htmlFor="repo-url" className="block text-sm font-medium text-gray-300 mb-2">URL del Repositorio de GitHub</label>
                        <input
                            type="text"
                            id="repo-url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/usuario/repositorio"
                            className={`w-full bg-slate-700 border rounded-md p-2 text-white focus:outline-none focus:ring-2 ${isValidUrl ? 'border-slate-600 focus:ring-sky-500' : 'border-red-500/50 focus:ring-red-500'}`}
                        />
                         {!isValidUrl && repoUrl.length > 0 && <p className="text-xs text-red-400 mt-1">Por favor, ingrese una URL válida de GitHub.</p>}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Secciones del Documento</h3>
                        <div className="space-y-3">
                            {SECTIONS.map(section => (
                                <label key={section.id} htmlFor={section.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        id={section.id}
                                        checked={!!selectedSections[section.id]}
                                        onChange={() => handleSectionToggle(section.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 accent-sky-500"
                                    />
                                    <div className="flex items-center gap-3 text-gray-300">
                                        {section.icon}
                                        <span className="text-sm font-medium">{section.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="target-language" className="block text-sm font-medium text-gray-300 mb-2">Idioma del Documento Final</label>
                        <select
                            id="target-language"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={isLoading || isTranslating}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            {ARGOS_LANGUAGES.filter(lang => lang.value !== 'all').map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleTranslate}
                            disabled={!generatedContent || isLoading || isTranslating}
                            className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isTranslating ? <SpinnerIcon className="w-5 h-5"/> : <TranslateIcon className="w-5 h-5"/>}
                            {isTranslating ? 'Traduciendo...' : 'Traducir Documento'}
                        </button>
                        {translatedContent && (
                            <button onClick={() => setTranslatedContent(null)} className="w-full mt-2 text-sm text-sky-400 hover:underline">
                                Mostrar Original
                            </button>
                        )}
                    </div>
                    <div>
                        <label htmlFor="didactic-format" className="block text-sm font-medium text-gray-300 mb-2">Funciones Didácticas y Formatos Profesionales</label>
                        <select
                            id="didactic-format"
                            value={didacticFormat}
                            onChange={(e) => setDidacticFormat(e.target.value)}
                            disabled={isLoading || isUpdating || !generatedContent}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                        >
                            {DIDACTIC_FUNCTIONS.map(format => (
                                <option key={format.id} value={format.id} disabled={format.id === ''}>{format.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleUpdateDocument}
                            disabled={!didacticFormat || !generatedContent || isLoading || isUpdating}
                            className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUpdating ? <SpinnerIcon className="w-5 h-5"/> : <RefreshIcon className="w-5 h-5"/>}
                            {isUpdating ? 'Actualizando...' : 'Actualizar Documento'}
                        </button>
                    </div>
                     <div className="mt-auto pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate || isLoading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <GearIcon className="w-5 h-5"/>}
                            {isLoading ? 'Generando...' : 'Generar Documento'}
                        </button>
                    </div>
                </aside>

                {/* Right Panel: Viewer */}
                <div className="w-2/3 flex flex-col overflow-hidden">
                     <div className="flex-grow overflow-y-auto p-1 relative bg-slate-900/50">
                        {isLoading && (
                            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <SpinnerIcon className="w-10 h-10 text-sky-400"/>
                                <p className="mt-4 text-gray-300">{progressMessage}</p>
                            </div>
                        )}
                        {isUpdating && (
                            <div className="absolute top-0 left-0 right-0 bg-sky-600/80 backdrop-blur-sm text-white p-2 text-center text-sm z-20 flex items-center justify-center shadow-lg">
                                <SpinnerIcon className="w-4 h-4 mr-2" />
                                {updateMessage}
                            </div>
                        )}
                        {contentToDisplay ? (
                            <textarea
                                readOnly
                                value={contentToDisplay}
                                className="w-full h-full p-6 bg-transparent text-gray-300 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                            />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                                <GearIcon className="w-16 h-16 mb-4"/>
                                <h3 className="text-lg font-semibold text-gray-400">El documento generado aparecerá aquí.</h3>
                                <p className="max-w-sm mt-2">Introduce una URL de un repositorio de GitHub, selecciona las secciones que desees y haz clic en "Generar Documento".</p>
                            </div>
                        )}
                    </div>
                    <footer className="flex items-center justify-end p-4 border-t border-slate-800 flex-shrink-0 gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={!contentToDisplay || isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                        >
                            {isCopied ? <CheckIcon className="w-5 h-5"/> : <ClipboardIcon className="w-5 h-5"/>}
                            {isCopied ? '¡Copiado!' : 'Copiar Markdown'}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!contentToDisplay || isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                        >
                            <DownloadIcon className="w-5 h-5"/>
                            Descargar .md
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    </div>
  );
};

export default TechnicalDocGeneratorModal;