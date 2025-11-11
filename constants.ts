import { FilterOptions, ActiveTab, DateRange, DocumentType } from './types';

export const INITIAL_FILTERS: FilterOptions = {
  dateRange: 'all',
  documentType: 'all',
  country: 'all',
  language: 'all',
};

export const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'all', label: 'Todos los Resultados' },
  { id: 'documents', label: 'Documentos' },
  { id: 'videos', label: 'Videos' },
  { id: 'news', label: 'Noticias' },
  { id: 'forums', label: 'Foros' },
  { id: 'events', label: 'Eventos' },
  { id: 'magazines', label: 'Revistas' },
];

export const ARGOS_LANGUAGES: { value: string; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'pt', label: 'Português' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'ru', label: 'Русский' },
    { value: 'zh', label: '中文' },
    { value: 'ar', label: 'العربية' },
    { value: 'ja', label: '日本語' },
];

export const DATE_RANGE_OPTIONS: {value: DateRange, label: string}[] = [
    { value: 'all', label: 'Cualquier fecha' },
    { value: 'past_day', label: 'Últimas 24 horas' },
    { value: 'past_week', label: 'Última semana' },
    { value: 'past_month', label: 'Último mes' },
    { value: 'past_year', label: 'Último año' },
];

export const DOCUMENT_TYPE_OPTIONS: {value: DocumentType, label: string}[] = [
    { value: 'all', label: 'Cualquier tipo' },
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'Word (.docx)' },
    { value: 'XLSX', label: 'Excel (.xlsx)' },
    { value: 'PPTX', label: 'PowerPoint (.pptx)' },
    { value: 'EPUB', label: 'ePub (.epub)' },
    { value: 'HTML', label: 'Página Web (.html)' },
    { value: 'TXT', label: 'Texto Plano (.txt)' },
];

export const COUNTRY_OPTIONS: {value: string, label: string}[] = [
    { value: 'all', label: 'Cualquier país' },
    { value: 'USA', label: 'Estados Unidos' },
    { value: 'GBR', label: 'Reino Unido' },
    { value: 'CAN', label: 'Canadá' },
    { value: 'AUS', label: 'Australia' },
    { value: 'DEU', label: 'Alemania' },
    { value: 'FRA', label: 'Francia' },
];

export const LANGUAGE_OPTIONS: {value: string, label: string}[] = [
    { value: 'all', label: 'Cualquier idioma' },
    { value: 'en', label: 'Inglés' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Francés' },
    { value: 'de', label: 'Alemán' },
    { value: 'zh', label: 'Chino' },
];