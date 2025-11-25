
import React from 'react';
import { WorkbenchFlashcard } from '../../types';
import { XIcon } from '../icons/XIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { SummarizeIcon } from '../icons/SummarizeIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';

interface AddToNotebookModalProps {
  card: WorkbenchFlashcard;
  onClose: () => void;
  onConfirm: (formattedText: string) => void;
}

const AddToNotebookModal: React.FC<AddToNotebookModalProps> = ({ card, onClose, onConfirm }) => {
  const handleConfirm = (type: 'summary' | 'full' | 'verbatim') => {
    let text;
    switch (type) {
      case 'summary':
        text = card.citation;
        break;
      case 'full':
        text = card.originalText;
        break;
      case 'verbatim':
        const regex = new RegExp(`(${card.queryMatch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        text = card.originalText.replace(regex, `**$1**`);
        break;
      default:
        text = card.citation;
    }

    const citationText = `> ${text.replace(/\n/g, '\n> ')}\n>\n> **Fuente**: ${card.sourceDocument.filename} | **Página**: ${card.pageNumber} | **País**: ${card.sourceDocument.country}\n---\n\n`;
    onConfirm(citationText);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Agregar al Cuaderno de Trabajo</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          <p className="text-gray-400 mb-2 text-sm">Cita seleccionada:</p>
          <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700 max-h-24 overflow-y-auto">
            <p className="text-sm text-gray-300 italic">"{card.citation}"</p>
          </div>
          
          <h4 className="text-gray-300 mt-6 mb-4 font-medium">Opciones Rápidas de Inserción</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <button
              onClick={() => handleConfirm('summary')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <SummarizeIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Resumida</span>
              <span className="text-xs text-gray-400 mt-1">Copia la cita resumida por la IA.</span>
            </button>
             <button
              onClick={() => handleConfirm('full')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <BookOpenIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Completa</span>
              <span className="text-xs text-gray-400 mt-1">Copia el párrafo original completo.</span>
            </button>
            <button
              onClick={() => handleConfirm('verbatim')}
              className="flex flex-col items-center justify-center text-center p-4 bg-slate-700 hover:bg-sky-700 border border-slate-600 hover:border-sky-500 rounded-lg transition-all"
            >
              <ClipboardListIcon className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">Textual</span>
              <span className="text-xs text-gray-400 mt-1">Párrafo original con búsqueda resaltada.</span>
            </button>
          </div>

          <div className="mt-8">
            <h4 className="text-gray-300 mb-4 font-medium">Plantillas de Prompts para Resúmenes Avanzados</h4>
            <p className="text-sm text-gray-400 mb-4">Haz clic en el tipo de resumen que necesitas para expandir la plantilla profesional:</p>
            
            <h2 className="text-xl font-bold mb-2">📚 <strong>PLANTILLA 1: RESUMEN ACADÉMICO/UNIVERSITARIO</strong></h2>
            <p className="italic mb-2 text-sm text-gray-400">Ideal para: papers, ensayos, artículos científicos, tesis</p>
            <details>
              <summary><b>▶ HAZ CLIC AQUÍ PARA EXPANDIR ESTA PLANTILLA</b></summary>
              <div className="details-content">
                <h3><strong>PROMPT PROFESIONAL:</strong></h3>
                <pre><code>{`Actúa como un investigador senior especializado en [CAMPO ACADÉMICO]. 
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

**VERIFICACIÓN FINAL:** Antes de entregar, verifica que el resumen pueda sustituir la lectura completa para un académico familiarizado con el tema.`}</code></pre>
                <h3><strong>PARÁMETROS PERSONALIZABLES:</strong></h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><strong>CAMPO ACADÉMICO:</strong> [Psicología, Derecho, Ingeniería, etc.]</li>
                  <li><strong>EXTENSIÓN:</strong> Máxima palabras permitidas</li>
                  <li><strong>NIVEL:</strong> Licenciatura/Maestría/Doctorado</li>
                </ul>
                <h3 className="mt-4"><strong>EJEMPLO DE USO:</strong></h3>
                <p className="text-sm italic">"Actúa como investigador senior en Ciencias de la Computación..."</p>
              </div>
            </details>
            <hr className="my-6 border-slate-700" />

            <h2 className="text-xl font-bold mb-2">💼 <strong>PLANTILLA 2: RESUMEN EJECUTIVO/CORPORATIVO</strong></h2>
            <p className="italic mb-2 text-sm text-gray-400">Ideal para: informes, propuestas de negocio, análisis de mercado</p>
            <details>
                <summary><b>▶ HAZ CLIC AQUÍ PARA EXPANDIR ESTA PLANTILLA</b></summary>
                <div className="details-content">
                    <h3><strong>PROMPT PROFESIONAL:</strong></h3>
                    <pre><code>{`Eres un CEO asesor estratégico con 20 años de experiencia. Resume este documento como un informe ejecutivo de alto nivel.

**MANDATOS ESTRATÉGICOS:**
1. PROBLEMA-OPORTUNIDAD: Define la situación crítica en 2-3 frases con impacto cuantificado ($, %, ROI)
2. SOLUCIÓN PROPUESTA: Explica la recomendación principal con viabilidad
3. EVIDENCIA COMPETITIVA: 3 puntos de datos clave que justifiquen la decisión
4. RIESGOS Y MITIGACIÓN: Identifica 2-3 riesgos principales con planes de contingencia
5. LLAMADA A LA ACCIÓN: Recomendación concreta con timeline y recursos necesarios

**FORMATO BUSINESS:**
- Extensión: 150-250 palabras
- Estilo: Voz activa, lenguaje de acción (verbos: "capturar", "escalar", "optimizar")
- Métricas: Obligatorio incluir 3 cifras monetarias o de impacto
- Estructura: 5 párrafos con HEADERS en MAYÚSCULAS

**TONO:** Directo, confiado, orientado a resultados. Elimina "quizás", "podría".

**REGLAS DE ORO:**
- Si hay un número, redondea al dígito más significativo (ej: $1.2M en lugar de $1,234,567)
- Usa analogías de negocio: "low-hanging fruit", "game-changer" solo si el documento lo amerita
- No incluyas metodología a menos que afecte la confiabilidad de los datos

**FILTRO DE VALOR:** Cada frase debe responder "¿Qué implica esto para el P&L?"`}</code></pre>
                    <h3><strong>PARÁMETROS PERSONALIZABLES:</strong></h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        <li><strong>SECTOR INDUSTRIA:</strong> [Finanzas, Tech, Salud, etc.]</li>
                        <li><strong>AUDIENCIA:</strong> [Junta Directiva, Inversionistas, Equipo Operativo]</li>
                        <li><strong>FOCO:</strong> [Rentabilidad, Crecimiento, Eficiencia]</li>
                    </ul>
                    <h3 className="mt-4"><strong>EJEMPLO DE USO:</strong></h3>
                    <p className="text-sm italic">"Eres CEO asesor estratégico en sector Financiero. Resume para Junta Directiva..."</p>
                </div>
            </details>
            <hr className="my-6 border-slate-700" />
            
            <h2 className="text-xl font-bold mb-2">🎨 <strong>PLANTILLA 3: RESUMEN CREATIVO/NARRATIVO</strong></h2>
            <p className="italic mb-2 text-sm text-gray-400">Ideal para: novelas, guiones, contenido de marketing, historias</p>
            <details>
                <summary><b>▶ HAZ CLIC AQUÍ PARA EXPANDIR ESTA PLANTILLA</b></summary>
                <div className="details-content">
                  <h3><strong>PROMPT PROFESIONAL:</strong></h3>
                  <pre><code>{`Asume el rol de un narrador master y editor de bestsellers. Resume este contenido narrativo preservando su esencia emocional.

**EJES NARRATIVOS OBLIGATORIOS:**
1. ARCO DRAMÁTICO: Identifica el conflicto central, punto de giro y resolución
2. PERSONAJES CLAVE: Nombra solo 2-3 protagonistas con su motivación esencial
3. TEMA SUBYACENTE: Extrae el mensaje universal o moraleja sin didactismo
4. ATMÓSFERA: Describe el tono emocional (ej: "melancólico pero esperanzador")
5. MECÁNICA NARRATIVA: Técnica destacada (ej: "flashbacks", "narrador no confiable")

**FORMATO EDITORIAL:**
- Extensión: 100-200 palabras
- Estilo: Voz del autor original, lenguaje evocativo, ritmo fluido
- Estructura: 3 párrafos (Setup/Confrontación/Resolución)
- Prohibido: Spoilers innecesarios, pero sí el climax si es crucial

**TONO:** Adaptado al género: [suspenso=tenso, romance=cálido, noir=irónico]

**TÉCNICAS DE SÍNTESIS:**
- Usa metáforas del original o crea una que capture la totalidad
- Convierte diálogos clave en narrativa ("cuando X le dice a Y...")
- Preserva frases icónicas máx 1-2 si son fundamentales

**FILTRO EMOCIONAL:** El lector debe sentir lo mismo que con el original, pero en 5 minutos.`}</code></pre>
                  <h3><strong>PARÁMETROS PERSONALIZABLES:</strong></h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>GÉNERO:</strong> [Novela, Cine, Marketing Storytelling, Biografía]</li>
                    <li><strong>PÚBLICO:</strong> [Jóvenes adultos, Profesionales, Público general]</li>
                    <li><strong>SPOILER:</strong> [Sí/No] (para resúmenes de venta vs. análisis)</li>
                  </ul>
                  <h3 className="mt-4"><strong>EJEMPLO DE USO:</strong></h3>
                  <p className="text-sm italic">"Asume el rol de narrador master. Resume esta novela de suspense psicológico..."</p>
                </div>
            </details>
            <hr className="my-6 border-slate-700" />
            
            <h2 className="text-xl font-bold mb-2">🔬 <strong>PLANTILLA 4: RESUMEN TÉCNICO/ESPECIALIZADO</strong></h2>
            <p className="italic mb-2 text-sm text-gray-400">Ideal para: manuales, documentación, patentes, especificaciones técnicas</p>
            <details>
                <summary><b>▶ HAZ CLIC AQUÍ PARA EXPANDIR ESTA PLANTILLA</b></summary>
                <div className="details-content">
                  <h3><strong>PROMPT PROFESIONAL:</strong></h3>
                  <pre><code>{`Eres un ingeniero principal documentador técnico. Crea un resumen preciso y ejecutable del siguiente material técnico.

**COMPONENTES CRÍTICOS:**
1. OBJETIVO TÉCNICO: ¿Qué problema resuelve este sistema/proceso?
2. ARQUITECTURA/MÉTODO: Diagrama conceptual en texto (componentes y flujo)
3. PARÁMETROS CLAVE: Especificaciones técnicas numéricas con unidades
4. DEPENDENCIAS: Requisitos previos, compatibilidades, limitaciones técnicas
5. IMPLEMENTACIÓN: Pasos de alto nivel (no tutoriales, sí secuencia)
6. NOVEDAD/VENTAJA: Mejora frente a sistemas previos (eficiencia, costo, performance)

**FORMATO TÉCNICO:**
- Extensión: 150-300 palabras
- Estilo: Voz pasiva impersonal, lenguaje ISO/estándar técnico
- Estructura: Lista numerada o viñetas jerárquicas (nivel 1=mayor importancia)
- Precisión: Incluye valores exactos, versiones de software, tolerancias

**REGLAS DE INGENIERÍA:**
- Usa nomenclatura del documento: no traduzcas términos patentados
- Incluye ecuaciones solo si son el corazón del sistema (máx 1)
- Omite: casos de uso detallados, ejemplos de código >2 líneas
- Añade: acrónimos definidos al inicio si son >3

**TONO**: Clínico, neutral, sin ambigüedades. Cada afirmación es verificable.

**PRUEBA DE CALIDAD**: Un ingeniero debe poder diseñar/prototipar sin leer el original.`}</code></pre>
                  <h3><strong>PARÁMETROS PERSONALIZABLES:</strong></h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>DOMINIO:</strong> [Software, Hardware, Ingeniería Civil, Biotech]</li>
                    <li><strong>NIVEL DE EXPERTISIA:</strong> [Junior/Senior/Arquitecto]</li>
                    <li><strong>STANDARDS:</strong> [IEEE, ISO, RFC, propietario]</li>
                  </ul>
                  <h3 className="mt-4"><strong>EJEMPLO DE USO:</strong></h3>
                  <p className="text-sm italic">"Eres ingeniero principal documentador de APIs. Resume este RFC..."</p>
                </div>
            </details>
            <hr className="my-6 border-slate-700" />

            <h2 className="text-xl font-bold mb-2">⚡ <strong>PLANTILLA 5: RESUMEN PERSONAL/RÁPIDO</strong></h2>
            <p className="italic mb-2 text-sm text-gray-400">Ideal para: artículos de autoayuda, noticias, blogs, contenido personal</p>
            <details>
                <summary><b>▶ HAZ CLIC AQUÍ PARA EXPANDIR ESTA PLANTILLA</b></summary>
                <div className="details-content">
                  <h3><strong>PROMPT PROFESIONAL:</strong></h3>
                  <pre><code>{`Actúa como mi asistente de lectura personal y curador de información. Resume este contenido para mi consumo rápido.

**MANDATOS DE EFICIENCIA:**
1. QUÉ ES: Definición del tema en 1 frase coloquial
2. POR QUÉ IMPORTA: Beneficio personal o impacto en mi vida diaria
3. CÓMO FUNCIONA: Mecánica básica en 2-3 pasos o principios
4. QUÉ HACER: Acción concreta que puedo implementar hoy (tiene que ser SMART)
5. FUENTE/CREDIBILIDAD: Autor, institución o métrica de confianza

**FORMATO PERSONAL:**
- Extensión: 80-150 palabras
- Estilo: Segunda persona ("tú"), lenguaje directo, emojis opcionales
- Estructura: 5 viñetas con emojis guía (ej: 🎯 ¿Qué es? ⚡ ¿Por qué te importa?)
- Tiempo de lectura: Debe leerse en <60 segundos

**TONO:** Amigable, empático, sin jerga. Como un amigo experto que te explica.

**REGLAS DE SIMPLIFICACIÓN:**
- Si hay 10 ejemplos, elige el más representativo y universal
- Convierte "deberías" en "prueba esto"
- Elimina datos históricos a menos que sean <2 años y relevantes
- Prioriza: ¿qué me hace esto más inteligente/eficiente/feliz?

**VERIFICACIÓN**: ¿Puedo actuar con solo esta información? ¿Me genera una nueva idea clara?`}</code></pre>
                  <h3><strong>PARÁMETROS PERSONALIZABLES:</strong></h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>TU PERFIL:</strong> [Estudiante, Padre, Emprendedor, Ejecutivo estresado]</li>
                    <li><strong>TIEMPO DISPONIBLE:</strong> [1 minuto, 3 minutos, 5 minutos]</li>
                    <li><strong>INTERÉS:</strong> [Aprendizaje, Acción inmediata, Entretenimiento]</li>
                  </ul>
                  <h3 className="mt-4"><strong>EJEMPLO DE USO:</strong></h3>
                  <p className="text-sm italic">"Actúa como mi asistente personal. Soy emprendedor con 5 minutos. Resume..."</p>
                </div>
            </details>
            <hr className="my-6 border-slate-700" />

            <h2 className="text-xl font-bold mb-2">🎛️ <strong>CONFIGURADOR UNIVERSAL (COPIA Y PEGA)</strong></h2>
            <p className="text-sm text-gray-400 mb-2">Si ninguna plantilla calza perfecto, usa este <strong>prompt base</strong> y reemplaza las variables:</p>
            <pre><code>{`Actúa como [ROL EXPERTO: académico/CEO/narrador/ingeniero/asistente] especializado en [ÁREA].

Responde en [IDIOMA] un resumen [TIPO: académico/ejecutivo/creativo/técnico/personal] del documento que adjunto.

**NIVEL DE DETALLE:** [Máximo palabras] palabras, [Profundidad: superficial/medio/profundo]

**FOCO ESPECÍFICO:** Quiero que enfatices en [aspecto particular: metodología/ROI/tema emocional/arquitectura/acción práctica]

**EXCLUYE OBLIGATORIAMENTE:** [ej: ejemplos, datos históricos, metodología, spoilers]

**INCLUYE OBLIGATORIAMENTE:** [ej: números clave, citas icónicas, pasos de implementación]

**AUDIENCIA DESTINO:** [Para quién es el resumen: tu yo futuro, junta directiva, público general]

**TONO:** [Formal/Directo/Evocador/Clínico/Amigable]`}</code></pre>
            <hr className="my-6 border-slate-700" />
            
            <h2 className="text-xl font-bold mb-2">📋 <strong>CHECKLIST DE SELECCIÓCIÓN RÁPIDA</strong></h2>
            <table>
              <thead>
                <tr>
                  <th>Si tu documento es...</th>
                  <th>Y tu objetivo es...</th>
                  <th>Usa la Plantilla</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Paper, tesis, ensayo</td><td>Aprobar examen, citar</td><td>📚 <strong>Académico</strong></td></tr>
                <tr><td>Informe, pitch, análisis</td><td>Tomar decisión</td><td>💼 <strong>Ejecutivo</strong></td></tr>
                <tr><td>Novela, guión, story</td><td>Recomendar/disfrutar</td><td>🎨 <strong>Creativo</strong></td></tr>
                <tr><td>Manual, especificación</td><td>Implementar/usar</td><td>🔬 <strong>Técnico</strong></td></tr>
                <tr><td>Artículo, noticia, post</td><td>Aprender rápido</td><td>⚡ <strong>Personal</strong></td></tr>
              </tbody>
            </table>

          </div>
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-gray-200">
                Cerrar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AddToNotebookModal;