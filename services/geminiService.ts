
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
        type: { type: Type.STRING, description: "File type: PDF, DOCX, XLSX, PPTX, EPUB, HTML, or TXT" },
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

  // FIX: Explicitly type `value` as `any` to resolve TypeScript error about unknown properties.
  const propertiesDescription = Object.entries(schema.items.properties).map(([key, value]: [string, any]) => `- \`${key}\`: ${value.description || value.type}`).join('\n');

  const prompt = `
    Based on the following query and filters, generate a comprehensive list of search results for the '${String(category)}' category.
    Query: "${query}"
    Filters: ${JSON.stringify(filters, null, 2)}
    
    **CRITICAL Instructions**:
    1.  **Use Web Search**: You MUST use your integrated Google Search tool to find REAL, LIVE, and VERIFIABLE online sources for each result.
    2.  **Real URLs**: The 'url' field for each item must be a direct, working hyperlink to the source you found. DO NOT invent, hallucinate, or create placeholder URLs.
    3.  **Strict JSON Output**: Your entire response MUST be a single, valid JSON array of objects. Do not include any text, explanations, or markdown before or after the JSON array. If no results are found, you MUST return an empty array \`[]\`.
    4.  **JSON Structure**: Each object in the array must conform to the following structure:
        ${propertiesDescription}
    5.  **Language**: ${languageInstruction}
    6.  **ID and Category**: The 'id' for each item must be a unique string (e.g., '${String(category).slice(0, 3)}-1'). The 'category' must be exactly '${String(category)}'.
    
    Ensure the generated data is realistic and relevant to the query. 
    ${documentSpecificInstructions}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Use Google Search for grounding
        systemInstruction: `You are a highly advanced search engine system called 'Plataforma de Estudio Multimodal'. Your purpose is to find real, live, and validated content from various sources for a specific category using your web search capabilities. You must return the results in a strict JSON format (an array of items) that adheres to the user-provided structure. Do not add any extra text or explanations.`,
      },
    });
    
    const jsonText = response.text?.trim();
    if (!jsonText) {
        console.warn(`Gemini API returned no text for category '${String(category)}'.`);
        return [];
    }
    // Basic cleanup in case the model wraps the JSON in markdown
    const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
    
    // Prevent JSON.parse from failing on an empty string
    if (cleanedJsonText.trim() === '') {
        return [];
    }

    return JSON.parse(cleanedJsonText);
  } catch (error) {
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
        }).then(response => response.text ?? '');
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
        return response.text ?? '';
    } catch (error) {
        console.error("Error summarizing content with Gemini API:", error);
        throw new Error("Failed to summarize document content.");
    }
};

export const generateCustomSummary = async (content: string, promptInstruction: string, image?: { data: string, mimeType: string }, useSearch: boolean = false): Promise<string> => {
    const ai = getAI();
    
    // Construct the parts array for the request
    let parts: any[] = [];
    
    if (image) {
        // If image is present, it's the primary content for multimodal analysis
        parts.push({ text: promptInstruction }); // The prompt describes what to do with the image
        parts.push({
            inlineData: {
                data: image.data,
                mimeType: image.mimeType
            }
        });
    } else {
        // Text-only mode
        parts.push({ text: `${promptInstruction}\n\n--- DOCUMENT CONTENT ---\n${content}\n--- END OF CONTENT ---` });
    }

    try {
        // Use flash for multimodal inputs as it handles images + text efficiently.
        // If useSearch is true, we must use a model that supports tools (flash or pro). 
        // We stick to 'gemini-2.5-flash' for general speed/multimodal, or upgrade to 'gemini-2.5-pro' if needed.
        // For simplicity and consistency with existing code:
        const model = image ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

        const config = useSearch ? { tools: [{googleSearch: {}}] } : undefined;

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: config
        });
        return response.text ?? 'No se pudo generar el resumen.';
    } catch (error) {
        console.error("Error generating custom summary:", error);
        throw new Error("Failed to generate custom summary.");
    }
};

export const generateImageCaption = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const prompt = "Describe this image for a document caption. Be concise and descriptive. Respond in Spanish.";
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart] },
      });
      return response.text ?? "Descripción no disponible.";
    } catch (error) {
      console.error("Error generating image caption:", error);
      return "Descripción no disponible.";
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const prompt = "Analiza y extrae todo el texto legible de esta imagen. Si hay texto, transcríbelo manteniendo el formato original en la medida de lo posible. Si no hay texto, responde con una cadena vacía.";

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }, imagePart] },
        });
        return response.text ?? "No se pudo extraer texto de la imagen.";
    } catch (error) {
        console.error("Error extracting text from image:", error);
        return "No se pudo extraer texto de la imagen.";
    }
};

export const analyzeRepository = async (repoUrl: string, analysisTopic: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Analyze the public GitHub repository located at the following URL: ${repoUrl}

        Your task is to generate a section for a professional technical document based on the following topic:
        **Topic: ${analysisTopic}**

        Provide your response in well-formatted Markdown in SPANISH.
        Do not include any introductory phrases like "Here is the section..." or "Based on the repository...".
        Directly generate the raw Markdown content for the requested section.
        If the repository is inaccessible or you cannot perform the analysis, respond with a clear error message in Markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for complex analysis
            contents: prompt,
            config: {
                systemInstruction: `You are a world-class senior software architect and technical writer. Your task is to analyze a given public GitHub repository and generate sections of a professional technical document. You must infer the project's architecture, purpose, and potential issues from the repository's structure and any available code snippets or documentation, as you do not have direct file access. RESPOND IN SPANISH.`,
            },
        });
        return response.text ?? `### Error Analizando Repositorio\n\nNo se pudo generar la sección para "${analysisTopic}".\n\n**Razón:** No se devolvió contenido.`;
    } catch (error) {
        console.error(`Error analyzing repository for topic '${analysisTopic}':`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return `### Error Analizando Repositorio\n\nNo se pudo generar la sección para "${analysisTopic}".\n\n**Razón:** ${errorMessage}`;
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
        return response.text ?? '';
    } catch (error) {
        console.error(`Error translating full document to ${targetLanguageLabel}:`, error);
        throw new Error(`Failed to translate the document to ${targetLanguageLabel}.`);
    }
};

// --- DIDACTIC & PROFESSIONAL FORMAT FUNCTIONS ---

export const generateExecutiveSummary = async (documentText: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Generate an executive summary for the following technical document.
        The summary must be a single paragraph.
        It must be no more than 150 words.
        It must have a Flesch-Kincaid readability score of 12 or lower.
        The summary must include the project's main objective and its key result or conclusion.
        Return ONLY the summary text, without any headers or introductory phrases.
        Respond in SPANISH.

        --- DOCUMENT TEXT ---
        ${documentText}
        --- END TEXT ---
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text ?? "Error: Could not generate summary.";
    } catch (error) {
        console.error("Error generating executive summary:", error);
        return "Error: Could not generate summary.";
    }
};

export const generateRelatedWork = async (repoUrl: string, documentText: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Analyze the following technical document derived from the repository at ${repoUrl}.
        Your task is to generate a "Related Work" section in Markdown.
        1.  Extract the key technical concepts and keywords from the document.
        2.  Simulate a search on academic databases (like arXiv, Crossref) for these concepts.
        3.  Generate a comparative paragraph that discusses how this project relates to at least 3 other similar or foundational technologies/papers.
        4.  The tone should be academic and professional.
        Return ONLY the Markdown content for the "Related Work" section.
        Respond in SPANISH.

        --- DOCUMENT TEXT ---
        ${documentText}
        --- END TEXT ---
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text ?? "Error: Could not generate related work section.";
    } catch (error) {
        console.error("Error generating related work:", error);
        return "Error: Could not generate related work section.";
    }
};

export const generateGlossary = async (documentText: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Read the following technical document and identify up to 30 technical terms, acronyms, or jargon that a non-expert might not understand.
        For each term, provide a concise definition (under 120 characters).
        Format the output as a Markdown list. Example:
        *   **Term 1**: Brief definition.
        *   **Term 2**: Brief definition.
        Return ONLY the Markdown list for the "Glossary" section.
        Respond in SPANISH.

        --- DOCUMENT TEXT ---
        ${documentText}
        --- END TEXT ---
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text ?? "Error: Could not generate glossary.";
    } catch (error) {
        console.error("Error generating glossary:", error);
        return "Error: Could not generate glossary.";
    }
};

export const generateAuditChecklist = async (repoUrl: string, documentText: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Act as an ISO 9001/27001 auditor. Analyze the technical document for the repository at ${repoUrl}.
        Based on the content (ADRs, error logs, metrics), generate an audit checklist table in Markdown.
        The table should have three columns: "Requisito ISO", "Evidencia Encontrada", and "Estado (✅/❌)".
        Map the document's content to common ISO requirements like risk management, requirement traceability, and monitoring.
        Infer the status based on whether evidence is present in the document.
        Return ONLY the Markdown table for the "Check-list de Auditoría" section.
        Respond in SPANISH.

        --- DOCUMENT TEXT ---
        ${documentText}
        --- END TEXT ---
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text ?? "Error: Could not generate audit checklist.";
    } catch (error) {
        console.error("Error generating audit checklist:", error);
        return "Error: Could not generate audit checklist.";
    }
};

export const generateAnalyticalIndex = async (documentText: string): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Analyze the following document and act as a natural language processing (NLP) keyword extractor.
        Identify at least 10 key technical terms or concepts.
        For each term, simulate finding the page number where it first appears (assume a standard document format where every 300 words is a new page).
        Format the output as a two-column Markdown table: "Término" and "Página".
        The list of terms must be sorted alphabetically.
        Return ONLY the Markdown table for the "Índice Analítico" section.
        Respond in SPANISH.

        --- DOCUMENT TEXT ---
        ${documentText}
        --- END TEXT ---
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text ?? "Error: Could not generate analytical index.";
    } catch (error) {
        console.error("Error generating analytical index:", error);
        return "Error: Could not generate analytical index.";
    }
};
