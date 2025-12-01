import React, { useState, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { GearIcon } from './icons/GearIcon';
import { SummarySettings, FormatSettings, SummaryTemplateType, FormatStandardType } from '../types';
import { ThesisIcon } from './icons/ThesisIcon';
import { ApaIcon } from './icons/ApaIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { DocIcon } from './icons/FileIcons';
import { SummarizeIcon } from './icons/SummarizeIcon';

interface EditorSettingsModalProps {
    onClose: () => void;
    currentSummarySettings: SummarySettings;
    currentFormatSettings: FormatSettings;
    onApplySettings: (summary: SummarySettings, format: FormatSettings) => void;
    onGenerateSummary: (summarySettings: SummarySettings) => void;
}

export const TEMPLATES: { id: SummaryTemplateType; label: string; desc: string; prompt?: string }[] = [
    { 
        id: 'academic', 
        label: 'Académico / Universitario', 
        desc: 'Enfocado en hipótesis, metodología, resultados y conclusiones.',
        prompt: `Actúa como un investigador senior especializado en [CAMPO ACADÉMICO]. 
Tu tarea es crear un resumen académico riguroso del siguiente documento.

**REQUISITOS OBLIGATORIOS:**
1. TESIS CENTRAL: Extrae la hipótesis/tesis en 1-2 frases con precisión académica
2. METODOLOGÍA: Describe métodos, muestra, variables y diseño del estudio
3. RESULTADOS CLAVE: Enumera 3-5 hallazgos principales con datos cuantitativos si existen
4. LIMITACIONES: Menciona explícitamente las limitaciones metodológicas señaladas
5. IMPLICACIONES: Resume contribuciones teóricas y prácticas
6. FUTURAS LÍNEAS: Incluye recomendaciones para investigación futura

**FORMATO EXIGIDO:**
- Extensión: 200-300 palabras
- Estilo: Voz pasiva, tercera persona, lenguaje disciplinario
- Estructura: Párrafos numerados (1-6) según requisitos anteriores
- Prohibido: Opiniones, juicios de valor, citas textuales >5 palabras

**TONO:** Formal, objetivo, preciso. Usa terminología específica de [CAMPO].

**NIVEL DE DETALLE:**
- Incluye: datos estadísticos significativos (p<0.05), tamaños de efecto, intervalos de confianza
- Omite: revisiones bibliográficas extensas, citas de apoyo, ejemplos ilustrativos

**VERIFICACIÓN FINAL:** Antes de entregar, verifica que el resumen pueda sustituir la lectura completa para un académico familiarizado con el tema.`
    },
    { id: 'executive', label: 'Ejecutivo / Corporativo', desc: 'Prioriza ROI, recomendaciones estratégicas y puntos de acción.' },
    { id: 'creative', label: 'Creativo / Narrativo', desc: 'Destaca arco narrativo, personajes y tono emocional.' },
    { id: 'technical', label: 'Técnico / Especializado', desc: 'Detalla arquitectura, parámetros, dependencias e implementación.' },
    { id: 'personalized', label: 'Personalizado', desc: 'Define tus propios parámetros de generación.' },
];

const FORMATS: { id: FormatStandardType; label: string; details: FormatSettings }[] = [
    { 
        id: 'APA7', 
        label: 'APA 7ª Edición', 
        details: { standard: 'APA7', fontFamily: 'Times New Roman', fontSize: '12pt', lineHeight: '2.0', margins: '2.54cm', citationStyle: '(Autor, Año)' } 
    },
    { 
        id: 'Vancouver', 
        label: 'Vancouver', 
        details: { standard: 'Vancouver', fontFamily: 'Arial', fontSize: '11pt', lineHeight: '1.5', margins: '2.54cm', citationStyle: '[1]' } 
    },
    { 
        id: 'MLA9', 
        label: 'MLA 9ª Edición', 
        details: { standard: 'MLA9', fontFamily: 'Times New Roman', fontSize: '12pt', lineHeight: '2.0', margins: '2.54cm', citationStyle: '(Autor Pag)' } 
    },
    { 
        id: 'ISO690', 
        label: 'ISO 690', 
        details: { standard: 'ISO690', fontFamily: 'Helvetica', fontSize: '11pt', lineHeight: '1.15', margins: '2.5cm', citationStyle: '(AUTOR, Año)' } 
    },
    { 
        id: 'Institutional', 
        label: 'Institucional (Genérico)', 
        details: { standard: 'Institutional', fontFamily: 'Calibri', fontSize: '11pt', lineHeight: '1.5', margins: '3cm 2.5cm', citationStyle: 'Variable' } 
    },
];

const EditorSettingsModal: React.FC<EditorSettingsModalProps> = ({ onClose, currentSummarySettings, currentFormatSettings, onApplySettings, onGenerateSummary }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'format'>('summary');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Local State
    const [summarySettings, setSummarySettings] = useState<SummarySettings>(currentSummarySettings);
    const [formatSettings, setFormatSettings] = useState<FormatSettings>(currentFormatSettings);

    // --- Automatic Updates ---
    
    const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value as FormatStandardType;
        const formatData = FORMATS.find(f => f.id === selectedId)?.details;
        if (formatData) {
            setFormatSettings(formatData);
            // Automatically apply settings to parent
            onApplySettings(summarySettings, formatData);
        }
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTemplate = e.target.value as SummaryTemplateType;
        const newSummarySettings = { ...summarySettings, template: newTemplate };
        setSummarySettings(newSummarySettings);
        // Automatically apply settings to parent
        onApplySettings(newSummarySettings, formatSettings);
    };

    const handleCustomConfigChange = (key: string, value: string) => {
        const newConfig = { ...summarySettings.customConfig!, [key]: value };
        const newSummarySettings = { ...summarySettings, customConfig: newConfig };
        
        setSummarySettings(newSummarySettings);
        // Automatically apply settings to parent
        onApplySettings(newSummarySettings, formatSettings);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newSummarySettings = {
                ...summarySettings,
                sourceFile: e.target.files![0]
            };
            setSummarySettings(newSummarySettings);
            // Automatically apply settings to parent
            onApplySettings(newSummarySettings, formatSettings);
        }
    };

    const handleRemoveFile = () => {
        const newSummarySettings = { ...summarySettings, sourceFile: undefined };
        setSummarySettings(newSummarySettings);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Automatically apply settings to parent
        onApplySettings(newSummarySettings, formatSettings);
    };
    
    const handleGenerate = () => {
        if (!summarySettings.sourceFile) {
            alert('Por favor, suba un documento fuente antes de generar el resumen.');
            return;
        }
        onGenerateSummary(summarySettings);
        onClose();
    };

    const selectedTemplate = TEMPLATES.find(t => t.id === summarySettings.template);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <GearIcon className="w-6 h-6 text-sky-400" />
                        Ajustes de Editor Plus
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex border-b border-slate-700 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-slate-700 text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:bg-slate-800'}`}
                    >
                        <ThesisIcon className="w-4 h-4"/> Resumen con IA
                    </button>
                    <button 
                        onClick={() => setActiveTab('format')}
                        className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'format' ? 'bg-slate-700 text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:bg-slate-800'}`}
                    >
                        <ApaIcon className="w-4 h-4"/> Formato y Estilo
                    </button>
                </div>

                <div className="p-6 bg-slate-800/50 flex-grow overflow-y-auto">
                    {activeTab === 'summary' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* File Upload Section */}
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-sm font-semibold text-white mb-3">Documento Base para Resumen</h3>
                                <div className="flex flex-col gap-3">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                    />
                                    {!summarySettings.sourceFile ? (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-600 rounded-lg hover:border-sky-500 hover:bg-slate-700/50 transition-all text-gray-400 hover:text-white group"
                                        >
                                            <UploadCloudIcon className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition-colors" />
                                            <div className="text-center">
                                                <span className="block font-medium">Haga clic para subir documento</span>
                                                <span className="text-xs text-gray-500">PDF, DOCX, TXT e Imágenes (OCR)</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between bg-sky-900/20 border border-sky-800/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-sky-900 p-2 rounded">
                                                    <DocIcon className="w-6 h-6 text-sky-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{summarySettings.sourceFile.name}</p>
                                                    <p className="text-xs text-gray-400">{(summarySettings.sourceFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleRemoveFile}
                                                className="p-1.5 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded-md transition-colors"
                                                title="Eliminar archivo"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-700 pt-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Plantilla de Generación</label>
                                <select 
                                    value={summarySettings.template}
                                    onChange={handleTemplateChange}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                                >
                                    {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <p className="mt-2 text-sm text-gray-400 bg-slate-800 p-3 rounded border border-slate-700/50">
                                    {selectedTemplate?.desc}
                                </p>
                            </div>
                            
                            {selectedTemplate?.prompt && (
                                <div className="mt-4 border-t border-slate-700 pt-4">
                                    <label className="block text-xs font-semibold text-sky-400 mb-2 uppercase tracking-wider">
                                        Parámetros de Generación (Prompt Interno)
                                    </label>
                                    <div className="bg-slate-900 p-3 rounded-md border border-slate-700 text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                                        {selectedTemplate.prompt}
                                    </div>
                                </div>
                            )}

                            {summarySettings.template === 'personalized' && (
                                <div className="space-y-4 border-t border-slate-700 pt-4">
                                    <h4 className="font-semibold text-sky-400">Configuración Personalizada</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Enfoque Principal</label>
                                            <input 
                                                type="text" 
                                                value={summarySettings.customConfig?.focus || ''}
                                                onChange={(e) => handleCustomConfigChange('focus', e.target.value)}
                                                placeholder="Ej. Metodología, Costos..." 
                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Audiencia</label>
                                            <input 
                                                type="text" 
                                                value={summarySettings.customConfig?.audience || ''}
                                                onChange={(e) => handleCustomConfigChange('audience', e.target.value)}
                                                placeholder="Ej. Estudiantes, Directivos..." 
                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Tono</label>
                                            <select 
                                                value={summarySettings.customConfig?.tone || 'Formal'}
                                                onChange={(e) => handleCustomConfigChange('tone', e.target.value)}
                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                            >
                                                <option value="Formal">Formal</option>
                                                <option value="Técnico">Técnico</option>
                                                <option value="Persuasivo">Persuasivo</option>
                                                <option value="Coloquial">Coloquial</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Extensión (Palabras)</label>
                                            <input 
                                                type="text" 
                                                value={summarySettings.customConfig?.length || ''}
                                                onChange={(e) => handleCustomConfigChange('length', e.target.value)}
                                                placeholder="Ej. 200 palabras" 
                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'format' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Estándar de Formato</label>
                                <select 
                                    value={formatSettings.standard}
                                    onChange={handleFormatChange}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                                >
                                    {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                            </div>

                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
                                <h4 className="font-semibold text-white border-b border-slate-600 pb-2">Características Aplicadas</h4>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div className="text-gray-400">Tipografía:</div>
                                    <div className="text-sky-300 font-mono">{formatSettings.fontFamily} {formatSettings.fontSize}</div>
                                    
                                    <div className="text-gray-400">Interlineado:</div>
                                    <div className="text-sky-300 font-mono">{formatSettings.lineHeight}</div>
                                    
                                    <div className="text-gray-400">Márgenes:</div>
                                    <div className="text-sky-300 font-mono">{formatSettings.margins}</div>
                                    
                                    <div className="text-gray-400">Sistema de Citas:</div>
                                    <div className="text-sky-300 font-mono">{formatSettings.citationStyle}</div>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 italic">
                                Nota: Los ajustes se aplican automáticamente al documento.
                            </p>
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center flex-shrink-0 gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 transition-colors">
                        Cerrar
                    </button>
                    {activeTab === 'summary' && (
                        <button onClick={handleGenerate} className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-md bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 transition-all">
                            <SummarizeIcon className="w-4 h-4" /> Generar Resumen
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default EditorSettingsModal;