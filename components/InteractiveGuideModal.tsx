import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { HelpIcon } from './icons/HelpIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EyeIcon } from './icons/EyeIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { EditorPlusIcon } from './icons/EditorPlusIcon';
import { GearIcon } from './icons/GearIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';

type GuideSection = 'intro' | 'search' | 'viewer' | 'workbench' | 'editor' | 'generator';

const SECTIONS: { id: GuideSection; label: string; icon: React.ReactElement }[] = [
  { id: 'intro', label: 'Introducción', icon: <HelpIcon className="w-5 h-5"/> },
  { id: 'search', label: 'Búsqueda y Resultados', icon: <SearchIcon className="w-5 h-5"/> },
  { id: 'viewer', label: 'Visor de Documentos', icon: <EyeIcon className="w-5 h-5"/> },
  { id: 'workbench', label: 'Mesa de Trabajo', icon: <WorkbenchIcon className="w-5 h-5"/> },
  { id: 'editor', label: 'Editor Plus', icon: <EditorPlusIcon className="w-5 h-5"/> },
  { id: 'generator', label: 'Generador de Documentos', icon: <GearIcon className="w-5 h-5"/> },
];

const GuideContent: React.FC<{ section: GuideSection }> = ({ section }) => {
  switch (section) {
    case 'intro':
      return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">¡Bienvenido a la Plataforma de Estudio Multimodal!</h3>
          <p className="mb-4">Esta guía te mostrará cómo usar las potentes herramientas de la plataforma para potenciar tu investigación y creación de documentos.</p>
          <p>Navega por las secciones a la izquierda para aprender sobre cada módulo. Cada sección te dará una visión general y pasos claros sobre cómo utilizar la funcionalidad.</p>
        </>
      );
    case 'search':
      return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">Búsqueda y Resultados</h3>
          <p className="mb-6">El corazón de la plataforma. Encuentra información validada de diversas fuentes de manera rápida y eficiente.</p>
          
          <h4 className="text-lg font-semibold mb-2">Búsqueda Principal</h4>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li><strong>Ingresa tu consulta:</strong> Escribe lo que buscas en la barra de búsqueda principal.</li>
            <li><strong>Aplica Filtros (Opcional):</strong> Haz clic en "Ajustes" para filtrar por fecha, tipo de documento, país o idioma.</li>
            <li><strong>Inicia la Búsqueda:</strong> Presiona "Buscar" y la plataforma consultará múltiples fuentes para traerte los resultados más relevantes.</li>
            <li><strong>Navega por Categorías:</strong> Usa las pestañas (Documentos, Videos, Noticias, etc.) para explorar los diferentes tipos de resultados.</li>
          </ol>

          <h4 className="text-lg font-semibold mb-2">Búsqueda Especializada</h4>
           <ol className="list-decimal list-inside space-y-2">
            <li><strong>Abre el Creador de Prompts:</strong> Haz clic en el botón <span className="inline-flex items-center gap-1 font-mono text-sm bg-slate-700 px-2 py-1 rounded"><FilePlusIcon className="w-4 h-4"/> Búsqueda Especializada</span>.</li>
            <li><strong>Describe tu necesidad:</strong> Escribe un prompt detallado. Por ejemplo: "Encuentra artículos académicos sobre inteligencia artificial en la medicina publicados en el último año en español".</li>
            <li><strong>Ejecuta la búsqueda:</strong> La plataforma traducirá tu necesidad en una consulta estructurada y precisa para obtener los mejores resultados.</li>
          </ol>
        </>
      );
    case 'viewer':
       return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">Visor de Documentos</h3>
          <p className="mb-6">Una vez que encuentres un documento, nuestro visor te ofrece herramientas avanzadas para analizarlo sin salir de la plataforma.</p>
          
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Abrir el Visor:</strong> Haz clic en el botón "Ver" en cualquier tarjeta de resultado de tipo "Documento".</li>
            <li><strong>Resumir Contenido:</strong> Usa el botón "Resumir" para obtener una síntesis generada por IA de los puntos clave del documento.</li>
            <li><strong>Traducir:</strong> Selecciona un idioma del menú desplegable y haz clic en "Traducir" para ver el documento en el idioma que elijas. Puedes descargar la traducción.</li>
            <li><strong>Búsqueda Interna:</strong> Utiliza la barra de búsqueda dentro del visor para encontrar términos específicos. Los resultados aparecerán en el panel derecho como "flashcards".</li>
            <li><strong>Seleccionar y Exportar:</strong> Marca las casillas de las flashcards que te interesen. Puedes copiar el texto seleccionado o descargarlo en formato .txt o .md desde el panel de exportación.</li>
          </ol>
        </>
      );
    case 'workbench':
      return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">Mesa de Trabajo</h3>
          <p className="mb-6">Compara tus propios documentos con una consulta específica en un entorno seguro y privado.</p>
          
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Abre la Mesa de Trabajo:</strong> Haz clic en el botón correspondiente en el encabezado.</li>
            <li><strong>Carga tus Documentos:</strong> Arrastra y suelta tus archivos PDF o de texto en el área designada. Los archivos se procesan localmente en tu navegador para máxima privacidad.</li>
            <li><strong>Describe tu Búsqueda:</strong> Escribe la consulta o el hecho que quieres verificar o encontrar en tus documentos.</li>
            <li><strong>Busca en tu Carpeta Segura:</strong> La IA analizará tus documentos y generará "flashcards" con los hallazgos más relevantes.</li>
            <li><strong>Analiza y Anota:</strong> Haz clic en una flashcard para verla en contexto en el visor de documentos. Usa el botón '+' para agregar citas a tu "Cuaderno de Trabajo".</li>
            <li><strong>Exporta tu Investigación:</strong> El contenido del cuaderno puede ser copiado o exportado como un archivo Markdown.</li>
          </ol>
        </>
      );
    case 'editor':
       return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">Editor Plus</h3>
          <p className="mb-6">Un editor de documentos colaborativo y enriquecido con IA, diseñado para la creación de trabajos profesionales y académicos.</p>
          
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Inicia el Editor:</strong> Abre el módulo "Editor Plus" desde el encabezado.</li>
            <li><strong>Edición Inteligente:</strong> Utiliza la barra de herramientas para dar formato a tu texto. Arrastra imágenes directamente al documento; la IA generará un pie de foto automáticamente.</li>
            <li><strong>Gestión de Activos:</strong> Sube tus imágenes y otros activos en el panel izquierdo para tenerlos siempre a mano.</li>
            <li><strong>Comentarios y Colaboración:</strong> Selecciona texto y añade comentarios para trabajar en equipo. Visualiza los avatares de tus colaboradores en tiempo real.</li>
            <li><strong>Citas y Referencias:</strong> Inserta citas académicas en varios formatos (APA, MLA, etc.) y la plataforma gestionará la bibliografía por ti.</li>
            <li><strong>Exporta y Publica:</strong> Exporta tu trabajo a PDF con un solo clic o publícalo directamente en la web.</li>
          </ol>
        </>
      );
    case 'generator':
       return (
        <>
          <h3 className="text-2xl font-bold text-sky-400 mb-4">Generador de Documentos Técnicos</h3>
          <p className="mb-6">Crea documentación técnica profesional directamente desde un repositorio de GitHub de forma automática.</p>
          
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Abre el Generador:</strong> Accede a la herramienta desde el botón en el encabezado.</li>
            <li><strong>Ingresa la URL:</strong> Pega la URL de un repositorio público de GitHub.</li>
            <li><strong>Selecciona Secciones:</strong> Elige qué partes del documento quieres generar (resumen del proyecto, arquitectura, calidad del código, etc.).</li>
            <li><strong>Genera el Documento:</strong> La IA analizará el repositorio y redactará cada sección en formato Markdown.</li>
            <li><strong>Enriquece el Documento:</strong> Una vez generado, puedes añadir secciones didácticas como un "Resumen Ejecutivo", un "Glosario" o un "Índice Analítico" con el menú desplegable.</li>
            <li><strong>Traduce y Exporta:</strong> Traduce el documento final a cualquier idioma y descárgalo como un archivo .md.</li>
          </ol>
        </>
      );
    default:
      return null;
  }
};

const InteractiveGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('intro');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[800px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <HelpIcon className="w-6 h-6 text-sky-400"/>
            Guía Interactiva de la Plataforma
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
            <XIcon className="w-5 h-5"/>
          </button>
        </header>

        <main className="flex-grow flex overflow-hidden">
          <aside className="w-64 bg-slate-800/50 p-4 border-r border-slate-700 flex-shrink-0">
            <nav className="space-y-2">
              {SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-grow overflow-y-auto p-8 text-gray-300 leading-relaxed">
            <GuideContent section={activeSection} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default InteractiveGuideModal;
