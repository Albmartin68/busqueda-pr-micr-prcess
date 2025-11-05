
import React, { useState, useEffect, useCallback } from 'react';
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
    generateAnalyticalIndex
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

interface TechnicalDocGeneratorModalProps {
  onClose: () => void;
}

type SectionType = 'analysis' | 'format';
type SectionId = 'architecture' | 'error_handling' | 'monitoring' | 'ci_cd' | 'security' | 'executive_summary' | 'related_work' | 'glossary' | 'audit_checklist' | 'analytical_index';

interface Section {
    id: SectionId;
    label: string;
    icon: React.ReactElement;
    type: SectionType;
}

const ALL_SECTIONS: Section[] = [
    { id: 'architecture', label: 'Arquitectura General', icon: <DataFlowIcon className="w-5 h-5" />, type: 'analysis' },
    { id: 'error_handling', label: 'Manejo de Errores', icon: <BugIcon className="w-5 h-5" />, type: 'analysis' },
    { id: 'monitoring', label: 'Métricas y Monitoreo', icon: <ChartBarIcon className="w-5 h-5" />, type: 'analysis' },
    { id: 'ci_cd', label: 'CI/CD y Despliegue', icon: <BuildIcon className="w-5 h-5" />, type: 'analysis' },
    { id: 'security', label: 'Seguridad', icon: <IsoIcon className="w-5 h-5" />, type: 'analysis' },
    { id: 'executive_summary', label: 'Resumen Ejecutivo', icon: <ThesisIcon className="w-5 h-5"/>, type: 'format' },
    { id: 'related_work', label: 'Trabajo Relacionado', icon: <IeeeIcon className="w-5 h-5"/>, type: 'format' },
    { id: 'glossary', label: 'Glosario de Términos', icon: <BookOpenIcon className="w-5 h-5"/>, type: 'format' },
    { id: 'audit_checklist', label: 'Check-list de Auditoría', icon: <IsoIcon className="w-5 h-5"/>, type: 'format' },
    { id: 'analytical_index', label: 'Índice Analítico', icon: <ApaIcon className="w-5 h-5"/>, type: 'format' },
];

const DEFAULT_SELECTIONS: Record<SectionId, boolean> = {
    architecture: true, error_handling: true, monitoring: true, ci_cd: false, security: false,
    executive_summary: false, related_work: false, glossary: false, audit_checklist: false, analytical_index: false,
};


const TechnicalDocGeneratorModal: React.FC<TechnicalDocGeneratorModalProps> = ({ onClose }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [selectedSections, setSelectedSections] = useState<Record<SectionId, boolean>>(DEFAULT_SELECTIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSectionToggle = (id: SectionId) => {
        setSelectedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const handleGenerate = useCallback(async () => {
        if (!repoUrl.trim() || !repoUrl.includes('github.com')) {
            alert("Por favor, ingrese una URL válida de un repositorio público de GitHub.");
            return;
        }
        setIsLoading(true);
        setGeneratedContent('');
        setProgressMessage('Iniciando análisis del repositorio...');

        try {
            const analysisSectionIds = ALL_SECTIONS.filter(s => s.type === 'analysis' && selectedSections[s.id]).map(s => s.id);
            const formatSectionIds = ALL_SECTIONS.filter(s => s.type === 'format' && selectedSections[s.id]).map(s => s.id);

            let baseContent = '# Documentación Técnica Autogenerada\n\n';
            if (analysisSectionIds.length > 0) {
                const analysisPromises = analysisSectionIds.map(id => {
                    const section = ALL_SECTIONS.find(s => s.id === id)!;
                    setProgressMessage(`Analizando: ${section.label}...`);
                    return analyzeRepository(repoUrl, section.label)
                        .then(result => ({ id, result }));
                });

                const analysisResults = await Promise.all(analysisPromises);
                const analysisContent = analysisResults.map(({id, result}) => {
                    const section = ALL_SECTIONS.find(s => s.id === id)!;
                    return `## ${section.label}\n\n${result}`;
                }).join('\n\n---\n\n');
                baseContent += analysisContent;
            } else {
                baseContent += "No se seleccionaron secciones de análisis para el contenido base.";
            }
            
            setGeneratedContent(baseContent);

            let finalContent = baseContent;

            const orderedFormatIds = formatSectionIds.sort((a, b) => a === 'executive_summary' ? -1 : (b === 'executive_summary' ? 1 : 0));

            for (const id of orderedFormatIds) {
                const section = ALL_SECTIONS.find(s => s.id === id)!;
                setProgressMessage(`Generando: ${section.label}...`);
                let newSectionContent = '';

                switch (id) {
                    case 'executive_summary':
                        newSectionContent = await generateExecutiveSummary(baseContent);
                        finalContent = `## Resumen Ejecutivo\n\n${newSectionContent}\n\n---\n\n` + finalContent;
                        break;
                    case 'related_work':
                        newSectionContent = await generateRelatedWork(repoUrl, baseContent);
                        finalContent += `\n\n---\n\n## Trabajo Relacionado\n\n${newSectionContent}`;
                        break;
                    case 'glossary':
                        newSectionContent = await generateGlossary(baseContent);
                        finalContent += `\n\n---\n\n## Glosario de Términos\n\n${newSectionContent}`;
                        break;
                    case 'audit_checklist':
                        newSectionContent = await generateAuditChecklist(repoUrl, baseContent);
                        finalContent += `\n\n---\n\n## Check-list de Auditoría\n\n${newSectionContent}`;
                        break;
                    case 'analytical_index':
                        newSectionContent = await generateAnalyticalIndex(baseContent);
                        finalContent += `\n\n---\n\n## Índice Analítico\n\n${newSectionContent}`;
                        break;
                }
                setGeneratedContent(finalContent);
            }
        } catch (error) {
            console.error("Error generating document:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            setGeneratedContent(`### Error\n\nOcurrió un error al generar el documento:\n\n\`\`\`\n${errorMessage}\n\`\`\``);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    }, [repoUrl, selectedSections]);
    
    const handleCopy = () => {
        if (!generatedContent) return;
        navigator.clipboard.writeText(generatedContent).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleDownload = () => {
        if (!generatedContent) return;
        const blob = new Blob([generatedContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const repoName = repoUrl.split('/').pop() || 'document';
        link.download = `doc_${repoName}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderSectionList = (type: SectionType) => (
        <div className="space-y-2">
            {ALL_SECTIONS.filter(s => s.type === type).map(section => (
                <label key={section.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={selectedSections[section.id]}
                        onChange={() => handleSectionToggle(section.id)}
                        className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500 accent-sky-500"
                    />
                    {React.cloneElement(section.icon, { className: 'w-5 h-5 text-slate-400' })}
                    <span className="text-sm text-gray-300">{section.label}</span>
                </label>
            ))}
        </div>
    );
    

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
                        <div>
                            <h3 className="text-md font-semibold text-gray-300 mb-2 border-b border-slate-700 pb-2">Secciones de Análisis</h3>
                            {renderSectionList('analysis')}
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-gray-300 mb-2 border-b border-slate-700 pb-2">Formatos Profesionales</h3>
                            {renderSectionList('format')}
                        </div>
                    </aside>

                    <div className="w-2/3 flex flex-col bg-slate-800/50">
                        <div className="flex-grow p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-300">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <SpinnerIcon className="w-10 h-10 mb-4" />
                                    <p className="text-lg text-gray-300">{progressMessage}</p>
                                </div>
                            )}
                            {generatedContent && !isLoading && (
                                <pre className="whitespace-pre-wrap font-sans">{generatedContent}</pre>
                            )}
                            {!isLoading && !generatedContent && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                    <GearIcon className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-400">Listo para generar</h3>
                                    <p className="max-w-md mt-2">Introduce una URL de repositorio, selecciona las secciones deseadas y haz clic en "Generar Documento" para empezar.</p>
                                </div>
                            )}
                        </div>
                        {(generatedContent && !isLoading) && (
                            <div className="flex-shrink-0 p-2 border-t border-slate-700 flex items-center justify-end gap-2">
                                <button onClick={handleCopy} disabled={isLoading || !generatedContent} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                    {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                    {isCopied ? 'Copiado' : 'Copiar'}
                                </button>
                                <button onClick={handleDownload} disabled={isLoading || !generatedContent} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-sky-700 hover:bg-sky-600 text-white">
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
