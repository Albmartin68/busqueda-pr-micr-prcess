import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, FilterOptions, DocumentResult, VideoResult, NewsResult, ForumResult, EventResult, MagazineResult } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';

const schemas: Record<keyof SearchResult, any> = {
  documents: {
    type: Type.ARRAY,
    description: "List of document search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., doc-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'documents'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        type: { type: Type.STRING, description: "File type: PDF, DOCX, XLSX, or PPTX" },
        language: { type: Type.STRING },
        country: { type: Type.STRING },
        certification: { type: Type.STRING },
        content: { type: Type.STRING, description: "Full content of the document in Markdown format. Can include image tags like ![alt](url)." },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'type', 'language', 'country', 'certification', 'content'],
    },
  },
  videos: {
    type: Type.ARRAY,
    description: "List of video search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., vid-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'videos'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        duration: { type: Type.STRING, description: "Video duration, e.g., '12:34'" },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'duration'],
    },
  },
  news: {
    type: Type.ARRAY,
    description: "List of news search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., news-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'news'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        date: { type: Type.STRING, description: "Publication date, e.g., '2024-05-20'" },
        publisher: { type: Type.STRING },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'date', 'publisher'],
    },
  },
  forums: {
    type: Type.ARRAY,
    description: "List of forum search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., forum-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'forums'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        author: { type: Type.STRING },
        date: { type: Type.STRING, description: "Post date, e.g., '2024-05-19'" },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'author', 'date'],
    },
  },
  events: {
    type: Type.ARRAY,
    description: "List of event search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., event-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'events'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        date: { type: Type.STRING, description: "Event date, e.g., '2024-10-27'" },
        location: { type: Type.STRING },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'date', 'location'],
    },
  },
  magazines: {
    type: Type.ARRAY,
    description: "List of magazine search results.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for the item, e.g., mag-1" },
        category: { type: Type.STRING, description: "Category of the item, must be 'magazines'" },
        title: { type: Type.STRING },
        url: { type: Type.STRING },
        snippet: { type: Type.STRING },
        source: { type: Type.STRING },
        issue: { type: Type.STRING, description: "Magazine issue, e.g., 'Fall 2024'" },
        publisher: { type: Type.STRING },
      },
      required: ['id', 'category', 'title', 'url', 'snippet', 'source', 'issue', 'publisher'],
    },
  },
};

const fetchCategoryResults = async (
  query: string,
  filters: FilterOptions,
  category: keyof SearchResult
): Promise<DocumentResult[] | VideoResult[] | NewsResult[] | ForumResult[] | EventResult[] | MagazineResult[]> => {
  const ai = getAI();
  const schema = schemas[category];

  const languageMap = new Map(LANGUAGE_OPTIONS.map(l => [l.value, l.label]));
  const availableLanguages = LANGUAGE_OPTIONS.filter(lang => lang.value !== 'all').map(lang => lang.label).join(', ');

  const languageInstruction = filters.language === 'all'
    ? `The user wants results in any language. Provide results in a mix of relevant languages, prioritizing content in the following: ${availableLanguages}.`
    : `The user has specifically requested results in ${languageMap.get(filters.language) || filters.language}. All results MUST be in this language.`;

  const documentSpecificInstructions = category === 'documents'
    ? `For the 'documents' category, please generate plausible full-text content for the 'content' field. The content can be markdown, including image tags like ![alt text](url).`
    : '';

  const prompt = `
    Based on the following query and filters, generate a comprehensive list of search results for the '${String(category)}' category.
    Query: "${query}"
    Filters: ${JSON.stringify(filters, null, 2)}
    
    **CRITICAL Language Instructions**: ${languageInstruction}
    
    **CRITICAL URL Instructions**: For the 'url' field, you MUST generate a valid, publicly accessible, and realistic-looking URL. For example:
    - For 'documents', you could link to public PDF repositories (like arXiv.org), government publications, or university archives.
    - For 'videos', use valid YouTube or Vimeo URLs (e.g., https://www.youtube.com/watch?v=...).
    - For 'news', use URLs from well-known news agencies (like reuters.com, apnews.com, bbc.com).
    - For 'forums', use links to sites like Reddit, Stack Overflow, or other public forums.
    Do NOT use placeholder URLs like 'example.com', 'your-site.com', or generic non-existent links. The URLs should look real even if they are illustrative.

    Generate a list of relevant and varied results for the '${String(category)}' category. Prioritize quality over quantity.
    Ensure the generated data is realistic and relevant to the query. 
    ${documentSpecificInstructions}
    The 'id' for each item should be a unique string, for example '${String(category).slice(0, 3)}-1', '${String(category).slice(0, 3)}-123', etc.
    The 'category' for each item must be exactly '${String(category)}'.
    Adhere strictly to the provided JSON schema for the response. Do not add any extra text or explanations outside of the JSON object.
    If no results are found, you MUST return an empty array, and nothing else.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: `You are a highly advanced search engine system called 'Micro-Process Document Search'. Your purpose is to find and validate content from various sources for a specific category. You must return the results in a strict JSON format (an array of items) that adheres to the user-provided schema.`,
      },
    });
    
    const jsonText = response.text.trim();
    if (!jsonText) return [];
    return JSON.parse(jsonText);
  } catch (error) {
    // FIX: Explicitly convert category to string to avoid runtime error.
    console.error(`Error fetching search results for category '${String(category)}' from Gemini API:`, error);
    return [];
  }
};

export const fetchSearchResults = async (query: string, filters: FilterOptions): Promise<SearchResult> => {
  console.log("Searching with swarm for:", query, "with filters:", filters);

  const categories: (keyof SearchResult)[] = ['documents', 'videos', 'news', 'forums', 'events', 'magazines'];

  // Create a promise for each category, tagged with its category name
  const promises = categories.map(category =>
    fetchCategoryResults(query, filters, category)
      .then(data => ({ category, data })) // Tag data with its category
      .catch(error => {
        console.error(`Swarm search for category '${String(category)}' failed.`, error);
        return { category, data: [] }; // Return empty data on failure to not break Promise.all
      })
  );

  // Await all promises to resolve in parallel
  const resultsByCat = await Promise.all(promises);

  // Assemble the final result object using a reducer for robustness.
  // This prevents errors where results from one category could be mismatched
  // with another due to the previous brittle index-based assignment.
  const searchResult = resultsByCat.reduce((acc, result) => {
    // The `as any` is a practical concession to TypeScript's difficulty in correlating
    // the key with the value type in this kind of dynamic assignment with union types.
    // This is still far safer than the previous index-based approach.
    acc[result.category] = result.data as any;
    return acc;
  }, {
    documents: [],
    videos: [],
    news: [],
    forums: [],
    events: [],
    magazines: [],
  } as SearchResult);

  return searchResult;
};


let ai: GoogleGenAI;
const getAI = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }
    return ai;
}

// Function to translate document content using the "swarm" (parallel processing)
export const translateDocumentContent = async (content: string, targetLanguage: string): Promise<string[]> => {
    const ai = getAI();
    // Split content into chunks (e.g., by paragraph) to simulate the swarm
    const chunks = content.split('\n\n').filter(chunk => chunk.trim() !== '');

    if (chunks.length === 0) return [""];

    const languageMap = new Map(LANGUAGE_OPTIONS.map(l => [l.value, l.label]));
    const targetLanguageLabel = languageMap.get(targetLanguage) || targetLanguage;

    const translationPromises = chunks.map(chunk => {
        return ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text to ${targetLanguageLabel}. Do not add any extra explanations, just provide the raw translation:\n\n---\n\n${chunk}`,
        }).then(response => response.text);
    });

    try {
        const translatedChunks = await Promise.all(translationPromises);
        return translatedChunks;
    } catch (error) {
        console.error("Error during translation swarm:", error);
        throw new Error("Failed to translate document content.");
    }
};

export const summarizeContent = async (content: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Provide a concise, clear, and easy-to-understand summary of the following document content.
        Focus on the key points, main arguments, and important conclusions.
        The summary should be written in a neutral and objective tone.
        Return only the summary text, without any introductory phrases like "This document is about..." or "In summary...".

        --- DOCUMENT CONTENT ---
        ${content}
        --- END OF CONTENT ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing content with Gemini API:", error);
        throw new Error("Failed to summarize document content.");
    }
};

export const generateImageCaption = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const prompt = "Describe this image for a document caption. Be concise and descriptive.";
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
      });
      return response.text;
    } catch (error) {
      console.error("Error generating image caption:", error);
      return "Image description not available.";
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const prompt = "Extract all text from this image. If there is no text, respond with an empty string. Only return the extracted text, nothing else.";

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        return "Could not extract text from image.";
    }
};

export const analyzeRepository = async (repoUrl: string, analysisTopic: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Analyze the public GitHub repository located at the following URL: ${repoUrl}

        Your task is to generate a section for a professional technical document based on the following topic:
        **Topic: ${analysisTopic}**

        Provide your response in well-formatted Markdown.
        Do not include any introductory phrases like "Here is the section..." or "Based on the repository...".
        Directly generate the raw Markdown content for the requested section.
        If the repository is inaccessible or you cannot perform the analysis, respond with a clear error message in Markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for complex analysis
            contents: prompt,
            config: {
                systemInstruction: `You are a world-class senior software architect and technical writer. Your task is to analyze a given public GitHub repository and generate sections of a professional technical document. You must infer the project's architecture, purpose, and potential issues from the repository's structure and any available code snippets or documentation, as you do not have direct file access.`,
            },
        });
        return response.text;
    } catch (error) {
        console.error(`Error analyzing repository for topic '${analysisTopic}':`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return `### Error Analyzing Repository\n\nCould not generate the section for "${analysisTopic}".\n\n**Reason:** ${errorMessage}`;
    }
};

export const translateFullDocument = async (content: string, targetLanguage: string): Promise<string> => {
    const ai = getAI();
    const languageMap = new Map(LANGUAGE_OPTIONS.map(l => [l.value, l.label]));
    const targetLanguageLabel = languageMap.get(targetLanguage) || targetLanguage;

    const prompt = `
      Translate the following Markdown document to ${targetLanguageLabel}.
      
      **CRITICAL INSTRUCTIONS:**
      1.  Preserve ALL Markdown formatting perfectly. This includes headings (e.g., '#', '##'), lists ('-', '*'), code blocks ('\`\`\`'), bold ('**'), italics ('*'), links ('[]()'), etc.
      2.  Do not add any extra text, explanations, or introductory phrases like "Here is the translation...".
      3.  Return only the raw, translated Markdown content.

      --- DOCUMENT CONTENT ---
      ${content}
      --- END OF CONTENT ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error translating full document to ${targetLanguageLabel}:`, error);
        throw new Error(`Failed to translate the document to ${targetLanguageLabel}.`);
    }
};
