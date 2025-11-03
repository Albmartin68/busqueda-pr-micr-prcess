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

// Types specific to the Workbench to avoid conflicts and ensure clarity
// The new simplified model for the frontend mock, based on the user's spec.
export interface WorkbenchSourceDocument {
  id: string; // e.g., 'doc-1'
  filename: string;
  content: string; // The full (mocked) content of the document
  language: string; // e.g., 'es'
  country: string; // e.g., 'ESP'
}

export interface WorkbenchFlashcard {
  id: string; // e.g., 'flashcard-1-result-1'
  sourceDocument: WorkbenchSourceDocument;
  pageNumber: number;
  citation: string; // The AI-generated summary of the finding
  originalText: string; // The full original text of the finding
  queryMatch: string; // The specific term that was matched
  score: number; // A relevance score, e.g., 0.95
  paragraphId: string; // e.g., 'doc-1-p-42'
}