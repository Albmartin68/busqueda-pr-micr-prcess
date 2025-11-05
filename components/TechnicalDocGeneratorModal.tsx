import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { GearIcon } from './icons/GearIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { 
    analyzeRepository,
    generateExecutiveSummary,
    generateRelatedWork,
    generateGlossary,
    generateAuditChecklist,
    generateAnalyticalIndex,
    translateFullDocument
} from '../services/geminiService';
import { DataFlowIcon } from './icons/DataFlowIcon';
import { BugIcon } from './icons/BugIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BuildIcon } from './icons/BuildIcon';
import { IsoIcon } from './icons/IsoIcon';
import { ThesisIcon } from './icons/ThesisIcon';
import { IeeeIcon } from './icons/IeeeIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ApaIcon } from './icons/ApaIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { ARGOS_LANGUAGES } from '../constants';
import { RefreshIcon } from './icons/RefreshIcon';
import { XmlIcon } from './icons/XmlIcon';

interface TechnicalDocGeneratorModalProps {
  onClose: () => void;
}

type AnalysisSectionId = 'architecture' | 'error_handling' | 'monitoring' | 'ci_cd' | 'security';
type DidacticSectionId = 'executive_summary' | 'related_work' | 'glossary' | 'audit_checklist' | 'analytical_index';
type FormatId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5';

interface AnalysisSection {
    id: AnalysisSectionId;
    label: string;
    icon: React.ReactElement;
}

interface EducationalFormat {
    id: FormatId;
    label: string;
    icon: React.ReactElement;
    requiredDidacticSections: DidacticSectionId[];
}

const ANALYSIS_SECTIONS: AnalysisSection[] = [
    { id: 'architecture', label: 'Arquitectura General', icon: <DataFlowIcon className="w-5 h-5" /> },
    { id: 'error_handling', label: 'Manejo de Errores', icon: <BugIcon className="w-5 h-5" /> },
    { id: 'monitoring', label: 'Métricas y Monitoreo', icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'ci_cd', label: 'CI/CD y Despliegue', icon: <BuildIcon className="w-5 h-5" /> },
    { id: 'security', label: 'Seguridad', icon: <IsoIcon className="w-5 h-5" /> },
];

const EDUCATIONAL_FORMATS: EducationalFormat[] = [
    { id: 'M1', label: 'Tesis Universidad de Chile', icon: <ThesisIcon className="w-5 h-5"/>, requiredDidacticSections: ['executive_summary', 'glossary', 'analytical_index'] },
    { id: 'M2', label: 'Memoria Técnica ISO 9001', icon: <IsoIcon className="w-5 h-5"/>, requiredDidacticSections: ['audit_checklist'] },
    { id: 'M3', label: 'Artículo IEEE Access', icon: <IeeeIcon className="w-5 h-5"/>, requiredDidacticSections: ['executive_summary', 'related_work'] },
    { id: 'M4', label: 'Documento JATS 1.3 XML', icon: <XmlIcon className="w-5 h-5"/>, requiredDidacticSections: [] },
    { id: 'M5', label: 'Ensayo APA 7ª Edición', icon: <ApaIcon className="w-5 h-5"/>, requiredDidacticSections: ['executive_summary', 'glossary'] },
];

const DEFAULT_ANALYSIS_SELECTIONS: Record<AnalysisSectionId, boolean> = {
    architecture: true, error_handling: true, monitoring: true, ci_cd: false, security: false,
};

const TechnicalDocGeneratorModal: React.FC<TechnicalDocGeneratorModalProps> = ({ onClose }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [selectedAnalysisSections, setSelectedAnalysisSections] = useState<Record<AnalysisSectionId, boolean>>(DEFAULT_ANALYSIS_SELECTIONS);
    const [selectedFormat, setSelectedFormat] = useState<FormatId>(EDUCATIONAL_FORMATS[0].id);
    const [isConfigSelectorOpen, setIsConfigSelectorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [baseAnalysisContent, setBaseAnalysisContent] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>(ARGOS_LANGUAGES[0].value);

    const configSelectorRef = useRef<HTMLDivElement>(null);

    const contentToDisplay = translatedContent ?? generatedContent;

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (configSelectorRef.current && !configSelectorRef.current.contains(event.target as Node)) {
                setIsConfigSelectorOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSectionToggle = (id: AnalysisSectionId) => {
        setSelectedAnalysisSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const applyFormatToContent = useCallback(async (baseContent: string, formatId: FormatId) => {
        const format = EDUCATIONAL_FORMATS.find(f => f.id === formatId);
        if (!format) {
            console.error(`Formato con ID "${formatId}" no encontrado.`);
            return baseContent;
        }

        setProgressMessage(`Aplicando formato: ${format.label}...`);
        let finalContent = baseContent;

        const didacticFunctions: Record<DidacticSectionId, () => Promise<string>> = {
            executive_summary: () => generateExecutiveSummary(baseContent),
            related_work: () => generateRelatedWork(repoUrl, baseContent),
            glossary: () => generateGlossary(baseContent),
            audit_checklist: () => generateAuditChecklist(repoUrl, baseContent),
            analytical_index: () => generateAnalyticalIndex(baseContent),
        };
        
        const didacticHeaders: Record<DidacticSectionId, string> = {
            executive_summary: "Resumen Ejecutivo",
            related_work: "Trabajo Relacionado",
            glossary: "Glosario de Términos",
            audit_checklist: "Check-list de Auditoría",
            analytical_index: "Índice Analítico",
        };

        const sectionsToGenerate = [...format.requiredDidacticSections];
        // Ensure summary is always first if present
        if (sectionsToGenerate.includes('executive_summary')) {
            sectionsToGenerate.splice(sectionsToGenerate.indexOf('executive_summary'), 1);
            sectionsToGenerate.unshift('executive_summary');
        }

        for (const sectionId of sectionsToGenerate) {
            setProgressMessage(`Generando: ${didacticHeaders[sectionId]}...`);
            const sectionContent = await didacticFunctions[sectionId]();
            if (sectionId === 'executive_summary') {
                finalContent = `## ${didacticHeaders[sectionId]}\n\n${sectionContent}\n\n---\n\n` + finalContent;
            } else {
                finalContent += `\n\n---\n\n## ${didacticHeaders[sectionId]}\n\n${sectionContent}`;
            }
            setGeneratedContent(finalContent); // Update UI progressively
        }

        return finalContent;

    }, [repoUrl]);
    
    const handleGenerate = useCallback(async () => {
        if (!repoUrl.trim() || !repoUrl.includes('github.com')) {
            alert("Por favor, ingrese una URL válida de un repositorio público de GitHub.");
            return;
        }
        setIsLoading(true);
        setGeneratedContent('');
        setBaseAnalysisContent(null);
        setTranslatedContent(null);
        setProgressMessage('Iniciando análisis del repositorio...');

        try {
            const analysisSectionIds = ANALYSIS_SECTIONS.filter(s => selectedAnalysisSections[s.id]).map(s => s.id);

            let baseContent = `# Documentación Técnica Autogenerada\n\n**Repositorio Analizado:** ${repoUrl}\n\n`;
            
            if (analysisSectionIds.length > 0) {
                const analysisPromises = analysisSectionIds.map(id => {
                    const section = ANALYSIS_SECTIONS.find(s => s.id === id)!;
                    setProgressMessage(`Analizando: ${section.label}...`);
                    return analyzeRepository(repoUrl, section.label).then(result => ({ id, result }));
                });
                const analysisResults = await Promise.all(analysisPromises);
                const analysisContent = analysisResults.map(({id, result}) => {
                    const section = ANALYSIS_SECTIONS.find(s => s.id === id)!;
                    return `## ${section.label}\n\n${result}`;
                }).join('\n\n---\n\n');
                baseContent += analysisContent;
            } else {
                baseContent += "No se seleccionaron secciones de análisis para el contenido base.";
            }
            
            setBaseAnalysisContent(baseContent); // Save the raw analysis result

            const finalFormattedContent = await applyFormatToContent(baseContent, selectedFormat);
            setGeneratedContent(finalFormattedContent);
            
        } catch (error) {
            console.error("Error generating document:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            setGeneratedContent(`### Error\n\nOcurrió un error al generar el documento:\n\n\`\`\`\n${errorMessage}\n\`\`\``);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    }, [repoUrl, selectedAnalysisSections, selectedFormat, applyFormatToContent]);

    const handleUpdateFormat = useCallback(async () => {
        if (!baseAnalysisContent) {
            alert("Primero debe generar el documento base.");
            return;
        }
        setIsLoading(true);
        setTranslatedContent(null);
        try {
            const updatedContent = await applyFormatToContent(baseAnalysisContent, selectedFormat);
            setGeneratedContent(updatedContent);
        } catch (error) {
            console.error("Error updating format:", error);
            alert("Ocurrió un error al actualizar el formato.");
        } finally {
            setIsLoading(false);
        }
    }, [baseAnalysisContent, selectedFormat, applyFormatToContent]);
    
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
        link.href = url;
        const repoName = repoUrl.split('/').pop() || 'document';
        const langSuffix = translatedContent ? `_${targetLanguage}` : '';
        link.download = `doc_${repoName}${langSuffix}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleTranslate = async () => {
        if (!generatedContent) return;
        setIsTranslating(true);
        try {
            const translation = await translateFullDocument(generatedContent, targetLanguage);
            setTranslatedContent(translation);
        } catch (error) {
            console.error("Translation failed:", error);
            alert("Ocurrió un error al traducir el documento.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-3 border-b border-slate-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><GearIcon className="w-6 h-6 text-sky-400" /> Generador de Documentos Técnicos</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
                </header>
                
                <main className="flex-grow flex overflow-hidden">
                    <aside className="w-1/3 border-r border-slate-800 flex flex-col p-4 space-y-4 overflow-y-auto">
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-2 block">URL del Repositorio de GitHub</label>
                            <input 
                                type="url"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/usuario/repositorio"
                                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        <div className="relative" ref={configSelectorRef}>
                            <button 
                                onClick={() => setIsConfigSelectorOpen(prev => !prev)}
                                className="w-full flex justify-between items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-semibold text-sky-300 hover:text-sky-200 transition-colors duration-200"
                            >
                                <span>Configurar Secciones de Análisis</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isConfigSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isConfigSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 p-4 max-h-96 overflow-y-auto">
                                    <div className="space-y-2">
                                        {ANALYSIS_SECTIONS.map(section => (
                                            <label key={section.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAnalysisSections[section.id]}
                                                    onChange={() => handleSectionToggle(section.id)}
                                                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500 accent-sky-500"
                                                />
                                                {React.cloneElement(section.icon, { className: 'w-5 h-5 text-slate-400' })}
                                                <span className="text-sm text-gray-300">{section.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    <div className="w-2/3 flex flex-col bg-slate-800/50">
                        {generatedContent && !isLoading && (
                            <div className="flex-shrink-0 p-2 border-b border-slate-700 flex items-center justify-between gap-2 flex-wrap bg-slate-900/50">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="format-select" className="text-xs font-semibold text-gray-400 whitespace-nowrap">Formato Educativo:</label>
                                    <select 
                                        id="format-select"
                                        value={selectedFormat} 
                                        onChange={(e) => setSelectedFormat(e.target.value as FormatId)} 
                                        className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-2 pr-8 text-xs focus:ring-sky-500 focus:border-sky-500 appearance-none">
                                        {EDUCATIONAL_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                    <button onClick={handleUpdateFormat} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md">
                                        <RefreshIcon className="w-4 h-4" />
                                        <span>Actualizar</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} disabled={isTranslating} className="bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-2 pr-8 text-xs focus:ring-sky-500 focus:border-sky-500 appearance-none">
                                        {ARGOS_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                    </select>
                                    {translatedContent ? (
                                        <button onClick={() => setTranslatedContent(null)} className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md">Restaurar Original</button>
                                    ) : (
                                        <button onClick={handleTranslate} disabled={isTranslating} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-sky-700 hover:bg-sky-600 rounded-md disabled:bg-slate-500 w-28 justify-center">
                                            {isTranslating ? <SpinnerIcon className="w-4 h-4" /> : <TranslateIcon className="w-4 h-4" />}
                                            <span>{isTranslating ? 'Traduciendo...' : 'Traducir'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex-grow p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-300">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <SpinnerIcon className="w-10 h-10 mb-4" />
                                    <p className="text-lg text-gray-300">{progressMessage}</p>
                                </div>
                            )}
                            {contentToDisplay && !isLoading && (
                                <div className="whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: contentToDisplay.replace(/---\n/g, '<hr class="border-slate-700 my-6">\n') }}></div>
                            )}
                            {!isLoading && !generatedContent && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                    <GearIcon className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-400">Listo para generar</h3>
                                    <p className="max-w-md mt-2">Introduce una URL de repositorio, selecciona las secciones y haz clic en "Generar Documento" para empezar.</p>
                                </div>
                            )}
                        </div>
                        {(generatedContent && !isLoading) && (
                             <div className="flex-shrink-0 p-2 border-t border-slate-700 flex items-center justify-end gap-2">
                                <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                    {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                    {isCopied ? 'Copiado' : 'Copiar'}
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-sky-700 hover:bg-sky-600 text-white">
                                    <DownloadIcon className="w-4 h-4" /> Descargar (.md)
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="flex items-center justify-end p-3 border-t border-slate-800 flex-shrink-0">
                    <button onClick={handleGenerate} disabled={isLoading} className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white disabled:bg-slate-500 disabled:cursor-not-allowed w-52">
                        {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <GearIcon className="w-5 h-5" />}
                        {isLoading ? 'Generando...' : 'Generar Documento'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TechnicalDocGeneratorModal;
