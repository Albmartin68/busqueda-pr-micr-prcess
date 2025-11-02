// FIX: Define constants for the application.
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

export const TRANSLATION_LANGUAGES: { value: string; label: string }[] = [
    { value: 'English', label: 'Inglés' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Francés' },
    { value: 'German', label: 'Alemán' },
    { value: 'Chinese', label: 'Chino' },
    { value: 'Japanese', label: 'Japonés' },
    { value: 'Russian', label: 'Ruso' },
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
