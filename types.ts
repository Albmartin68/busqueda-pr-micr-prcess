// FIX: Define types for the application.
export type ActiveTab = 'all' | 'documents' | 'videos' | 'news' | 'forums' | 'events' | 'magazines';

export interface SearchResultItemBase {
  id: string;
  category: Exclude<ActiveTab, 'all'>;
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface DocumentResult extends SearchResultItemBase {
  category: 'documents';
  type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX';
  language: string;
  country: string;
  certification: string;
  content: string; // The full document content for the viewer
}

export interface VideoResult extends SearchResultItemBase {
    category: 'videos';
    duration: string;
}

export interface NewsResult extends SearchResultItemBase {
    category: 'news';
    date: string; // e.g., "2023-10-27"
    publisher: string;
}

export interface ForumResult extends SearchResultItemBase {
    category: 'forums';
    author: string;
    date: string;
}

export interface EventResult extends SearchResultItemBase {
    category: 'events';
    date: string;
    location: string;
}

export interface MagazineResult extends SearchResultItemBase {
    category: 'magazines';
    issue: string;
    publisher: string;
}

export type SearchResultItem = DocumentResult | VideoResult | NewsResult | ForumResult | EventResult | MagazineResult;

export interface SearchResult {
  documents: DocumentResult[];
  videos: VideoResult[];
  news: NewsResult[];
  forums: ForumResult[];
  events: EventResult[];
  magazines: MagazineResult[];
}

export type DateRange = 'all' | 'past_day' | 'past_week' | 'past_month' | 'past_year';
export type DocumentType = 'all' | 'PDF' | 'DOCX' | 'XLSX' | 'PPTX';

export interface FilterOptions {
    dateRange: DateRange;
    documentType: DocumentType;
    country: string;
    language: string;
}

export interface FlashcardItem {
  id: string; // e.g. "match-0-2" for paragraph 0, match 2
  snippet: string; // The text with the match highlighted for display in the flashcard.
  context: string; // The full paragraph or surrounding sentences.
  paragraphIndex: number;
}