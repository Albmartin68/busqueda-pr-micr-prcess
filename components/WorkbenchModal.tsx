// WorkbenchModal.tsx
import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { XIcon } from './icons/XIcon';
import { WorkbenchIcon } from './icons/WorkbenchIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ImportIcon } from './icons/ImportIcon';
import { FlashcardIcon } from './icons/FlashcardIcon';
import { DataFlowIcon } from './icons/DataFlowIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ARGOS_LANGUAGES } from '../constants';
import type {
  DocumentResult,
  WorkbenchFlashcard,
  WorkbenchSourceDocument,
} from '../types';

/* ---------- CONFIG ---------- */
const FLASHCARDS_PER_PAGE = 6;

/* ---------- TIPOS AUX ---------- */
type WorkflowStep = {
  step: string;
  tool: string;
  params: Record<string, unknown>;
  next_trigger: string;
};

/* ---------- FLUJO REAL (offline) ---------- */
const WORKFLOW_STEPS: WorkflowStep[] = [
  { step: 'Carga', tool: 'mesa', params: {}, next_trigger: 'Indexar' },
  { step: 'Indexar', tool: 'EEA', params: {}, next_trigger: 'MetadateX' },
  { step: 'MetadateX', tool: 'metadatex', params: {}, next_trigger: 'Traducir' },
  { step: 'Traducir', tool: 'enjambre_traductor', params: {}, next_trigger: 'BIC' },
  { step: 'BIC', tool: 'BIC', params: {}, next_trigger: 'Flashcards' },
  { step: 'Flashcards', tool: 'flashgen', params: {}, next_trigger: 'Visor' },
  { step: 'Visor', tool: 'pdfjs', params: {}, next_trigger: 'Cita' },
  { step: 'Cita', tool: 'clipper', params: {}, next_trigger: 'Editor' },
  { step: 'Editor', tool: 'slate', params: {}, next_trigger: 'Exportar' },
  { step: 'Exportar', tool: 'pandoc', params: {}, next_trigger: 'END' },
];

/* ---------- PROPS ---------- */
interface Props {
  onClose: () => void;
  onQueryIndexed: (q: string) => void;
  onViewSourceDocument: (d: DocumentResult, q?: string) => void;
}

/* ---------- HELPERS ---------- */
const normalizeText = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildDocResult = (w: WorkbenchSourceDocument): DocumentResult => ({
  id: `workbench-${w.name.replace(/\W/g, '')}-${w.articulo}`,
  category: 'documents',
  title: w.name,
  url: encodeURI(`file://${w.path ?? w.name}`),
  snippet: w.content.slice(0, 150) + '…',
  source: 'Carpeta Segura Interna',
  type: w.name.endsWith('.docx') ? 'DOCX' : 'PDF',
  language: w.lang ?? 'es',
  country: w.country,
  certification: 'Validado por EEA',
  content: w.content,
});

/* ---------- FLASHCARD MEMO ---------- */
const Flashcard = memo(function FlashcardC({
  card,
  used,
  onToggle,
  onView,
}: {
  card: WorkbenchFlashcard;
  used: boolean;
  onToggle: (id: string) => void;
  onView: (c: WorkbenchFlashcard) => void;
}) {
  const html = useMemo(() => {
    const safe = card.coincidencia
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /(\{\{\{highlight\}\}\}(.+?)\{\{\{\/highlight\}\}\})/gi,
        (_, __, m) =>
          `<mark class="bg-yellow-300 text-black px-1 rounded">${m}</mark>`
      );
    return { __html: safe };
  }, [card.coincidencia]);

  return (
    <div
      className={`bg-slate-700/50 rounded-lg p-3 border-2 transition ${
        used ? 'border-green-500 opacity-70' : 'border-transparent hover:border-slate-600'
      }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sky-400 text-sm">{card.pais}</span>
          <span className="text-xs text-gray-400 bg-slate-600/50 px-2 py-0.5 rounded-full">
            {card.tema}
          </span>
        </div>
        <button
          onClick={() => onView(card)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-sky-800 hover:bg-sky-700"
          aria-label="Ver documento fuente">
          <EyeIcon className="w-3 h-3" />
          Ver
        </button>
      </div>
      <p className="text-xs text-gray-300 mb-2">
        <strong className="text-gray-200">Coincidencia:</strong>
        <span dangerouslySetInnerHTML={html} />
      </p>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400 italic">
          Fuente: {card.sourceDocument.name}
        </p>
        <button
          onClick={() => onToggle(card.id)}
          disabled={used}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
            used
              ? 'bg-green-800/50 text-green-300 cursor-not-allowed'
              : 'bg-slate-600 hover:bg-slate-500'
          }`}>
          <CheckIcon className="w-3 h-3" />
          {used ? 'Utilizada' : 'Utilizar'}
        </button>
      </div>
    </div>
  );
});

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function WorkbenchModal({ onClose, onQueryIndexed, onViewSourceDocument }: Props) {
  /* ---- estado ---- */
  const [state, setState] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [targetLang, setTargetLang] = useState(ARGOS_LANGUAGES[0].value);
  const [docs, setDocs] = useState<WorkbenchSourceDocument[]>([]);
  const [flashQueue, setFlashQueue] = useState<WorkbenchFlashcard[]>([]);
  const [flashcardFilterQuery, setFlashcardFilterQuery] = useState('');
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [copyOk, setCopyOk] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  /* ---- efectos ---- */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  /* ---- memo ---- */
  const current = useMemo(
    () => (state > 0 ? WORKFLOW_STEPS[state - 1] : null),
    [state]
  );

  const orchestratorOutput = useMemo(() => {
    if (!current) return '';
    const params = { ...current.params };
    if (current.step === 'Traducir') params.target_lang = targetLang;
    if (current.step === 'BIC') params.query = userQuery;
    if (current.step === 'MetadateX') params.source_files = files.map((f) => f.name);
    return JSON.stringify({ state, output: { ...current, params } }, null, 2);
  }, [state, targetLang, userQuery, files]);

  const filteredFlashcards = useMemo(() => {
    if (!flashcardFilterQuery.trim()) {
      return flashQueue;
    }
    const lowercasedQuery = flashcardFilterQuery.toLowerCase();
    return flashQueue.filter(card =>
      card.coincidencia.toLowerCase().includes(lowercasedQuery) ||
      card.pais.toLowerCase().includes(lowercasedQuery) ||
      card.tema.toLowerCase().includes(lowercasedQuery)
    );
  }, [flashQueue, flashcardFilterQuery]);

  const totalPages = Math.ceil(filteredFlashcards.length / FLASHCARDS_PER_PAGE);

  const paginated = useMemo(
    () => filteredFlashcards.slice((page - 1) * FLASHCARDS_PER_PAGE, page * FLASHCARDS_PER_PAGE),
    [filteredFlashcards, page]
  );
  
  useEffect(() => {
    if(page > totalPages && totalPages > 0) {
        setPage(totalPages);
    } else if (totalPages === 0) {
        setPage(1);
    }
  }, [page, totalPages]);


  /* ---- handlers ---- */
  const nextStep = useCallback(() => {
    if (state === 0 && files.length === 0) return;
    if (state === 4 && !userQuery.trim()) return;

    if (state === 1) { // After Carga, before Indexar
      const newDocs: WorkbenchSourceDocument[] = files.map((file, i) => ({
        name: file.name,
        content: `Este es el contenido simulado para el archivo ${file.name}. Incluye una frase para buscar como "adopción internacional".\n\nY otro párrafo con más texto donde también se habla de adopción internacional para probar múltiples coincidencias.`,
        country: "ESP",
        articulo: `Art. ${i + 1}`,
        tema: "Derecho Civil",
        path: file.name, // Mock path
        lang: 'es', // Mock lang
      }));
      setDocs(newDocs);
    }

    /* MOCK del motor BIC -> genera flashcards reales */
    if (state === 4) {
      const q = normalizeText(userQuery);
      const pool: WorkbenchFlashcard[] = [];
      docs.forEach((d) => {
        const content = d.content;
        const normalizedContent = normalizeText(content);
        let lastIndex = -1;
        
        while ((lastIndex = normalizedContent.indexOf(q, lastIndex + 1)) !== -1) {
            const snippet = content.slice(
                Math.max(0, lastIndex - 80),
                lastIndex + q.length + 80
            );
            
            const safeQuery = userQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const highlightedSnippet = snippet.replace(new RegExp(`(${safeQuery})`, 'gi'), '{{{highlight}}}$1{{{/highlight}}}');

            pool.push({
                id: `fc-${d.name}-${d.articulo}-${lastIndex}`,
                pais: d.country,
                articulo: d.articulo,
                tema: d.tema,
                coincidencia: highlightedSnippet,
                sourceDocument: d,
            });
        }
      });
      setFlashQueue(pool);
      onQueryIndexed(userQuery);
    }

    setState((s) => Math.min(s + 1, WORKFLOW_STEPS.length));
  }, [state, files, userQuery, docs, onQueryIndexed]);

  const reset = useCallback(() => {
    setState(0);
    setFiles([]);
    setUserQuery('');
    setDocs([]);
    setFlashQueue([]);
    setFlashcardFilterQuery('');
    setUsed(new Set());
    setPage(1);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    setFiles((prev) => {
      const set = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !set.has(f.name))];
    });
    e.target.value = ''; // permite re-importar el mismo archivo
  }, []);

  const toggleUsed = useCallback((id: string) => {
    setUsed((prev) => new Set(prev).add(id));
  }, []);

  const viewDoc = useCallback(
    (c: WorkbenchFlashcard) => {
      // FIX: The query passed to the viewer must be the original user query
      // to ensure the correct term is highlighted, not the entire context snippet.
      onViewSourceDocument(buildDocResult(c.sourceDocument), userQuery);
    },
    [onViewSourceDocument, userQuery]
  );

  const copyJson = useCallback(() => {
    navigator.clipboard
      .writeText(orchestratorOutput)
      .then(() => {
        setCopyOk(true);
        setTimeout(() => setCopyOk(false), 1500);
      })
      .catch(() => {
        /* silencioso */
      });
  }, [orchestratorOutput]);

  /* ---- render ---- */
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <WorkbenchIcon className="w-6 h-6 text-sky-400" />
            Mesa de Trabajo
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={onFileSelect}
          className="hidden"
        />

        {/* body */}
        <div className="flex-grow flex overflow-hidden">
          {/* main */}
          <section className="p-4 flex-grow overflow-y-auto flex flex-col gap-6 w-full lg:w-2/3">
            {/* carpeta segura */}
            {state === 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200">Carpeta Segura Interna</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 min-h-[120px] max-h-[200px] overflow-y-auto">
                  {files.length ? (
                    <ul className="space-y-1 list-disc list-inside text-gray-300">
                      {files.map((f) => (
                        <li key={f.name} className="text-sm">
                          {f.name}{' '}
                          <span className="text-xs text-gray-500">- {(f.size / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center">
                      Importe archivos para comenzar.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* recolector */}
            {state === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-200 flex items-center gap-2">
                  <DataFlowIcon className="w-5 h-5 text-sky-400" />
                  Recolector de Datos Interno
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 max-h-[250px] overflow-y-auto">
                  <p className="text-sm text-gray-400 mb-3">
                    Analizando metadatos y extrayendo artículos…
                  </p>
                  <ul className="space-y-2">
                    {files.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md text-sm">
                        <span className="text-gray-300 truncate">{f.name}</span>
                        <span className="text-xs text-amber-400 font-mono">Procesando</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* entrada requerida */}
            {state === 3 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-sky-300">
                  Entrada requerida: Traducción
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Idioma de destino
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {ARGOS_LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {state === 4 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-sky-300">
                  Entrada requerida: Búsqueda Comparativa
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Consulta a comparar
                  </label>
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                    placeholder="Ej. adopción internacional"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* workflow visual */}
            <div className="overflow-x-auto p-2">
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                {WORKFLOW_STEPS.map((s, i) => (
                  <React.Fragment key={s.step}>
                    <div
                      className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 ${
                        state === i + 1
                          ? 'bg-sky-800 border-sky-500 text-white'
                          : state > i + 1
                          ? 'bg-slate-700 border-slate-600 text-gray-300'
                          : 'bg-slate-800 border-slate-700 text-gray-500'
                      }`}>
                      {s.step}
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className="text-gray-600 font-mono mx-1">&rarr;</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* json output */}
            <div className="flex-grow bg-slate-800/50 rounded-lg p-4 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Salida del Orquestador</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono bg-slate-700 px-2 py-1 rounded">
                    ESTADO: {state}
                  </span>
                  <button
                    onClick={copyJson}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md ${
                      copyOk ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                    }`}>
                    {copyOk ? <CheckIcon className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
                    {copyOk ? 'Copiado' : 'Copiar JSON'}
                  </button>
                </div>
              </div>
              <div className="flex-grow bg-black/30 rounded-md overflow-auto">
                <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {orchestratorOutput || 'Importe archivos y presione RUN para iniciar.'}
                </pre>
              </div>
            </div>
          </section>

          {/* flashcards aside */}
          <aside
            className={`flex flex-col bg-slate-800/70 backdrop-blur-sm transition-all duration-300 ease-in-out ${
              state >= 5 ? 'w-full lg:w-1/3 border-l' : 'w-0'
            } border-slate-700 overflow-hidden`}>
            {state >= 5 && (
              <>
                <header className="p-4 border-b border-slate-700 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <FlashcardIcon className="w-5 h-5 text-sky-400" />
                      Flashcards Generadas
                    </h3>
                    <span className="text-sm font-mono bg-slate-700 px-2 py-1 rounded-md">
                      {filteredFlashcards.length} de {flashQueue.length}
                    </span>
                  </div>
                   <div className="relative">
                      <input
                          type="text"
                          value={flashcardFilterQuery}
                          onChange={e => setFlashcardFilterQuery(e.target.value)}
                          placeholder="Filtrar flashcards..."
                          className="w-full bg-slate-700 border border-slate-600 rounded-md py-1.5 pl-8 pr-4 text-sm focus:ring-sky-500"
                      />
                      <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                  </div>
                </header>

                <div className="overflow-y-auto p-4 space-y-3 flex-grow">
                  {paginated.length ? (
                    paginated.map((c) => (
                      <Flashcard
                        key={c.id}
                        card={c}
                        used={used.has(c.id)}
                        onToggle={toggleUsed}
                        onView={viewDoc}
                      />
                    ))
                  ) : (
                    <div className="text-center p-4 text-gray-400 text-sm">
                      {flashcardFilterQuery
                        ? `No se encontraron flashcards para "${flashcardFilterQuery}".`
                        : `No se encontraron coincidencias para «${userQuery}».`
                      }
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <footer className="p-2 border-t border-slate-700 flex justify-between items-center">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                      Anterior
                    </button>
                    <span className="text-sm text-gray-400">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                      Siguiente
                    </button>
                  </footer>
                )}
              </>
            )}
          </aside>
        </div>

        {/* footer */}
        <footer className="flex items-center justify-between p-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-teal-600 hover:bg-teal-500 text-white">
              <ImportIcon className="w-5 h-5" />
              Importar
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 text-gray-200">
              <RefreshIcon className="w-5 h-5" />
              Reiniciar
            </button>
          </div>

          <button
            onClick={nextStep}
            disabled={
              (state === 0 && files.length === 0) ||
              (state === 4 && !userQuery.trim()) ||
              state >= WORKFLOW_STEPS.length
            }
            className={`px-8 py-2 text-sm font-semibold rounded-md ${
              state === WORKFLOW_STEPS.length
                ? 'bg-green-600'
                : 'bg-sky-600 hover:bg-sky-500'
            } text-white disabled:bg-slate-500 disabled:cursor-not-allowed`}>
            {!state ? 'RUN' : state === WORKFLOW_STEPS.length ? 'Finalizado' : 'Siguiente'}
          </button>
        </footer>
      </div>
    </div>
  );
}