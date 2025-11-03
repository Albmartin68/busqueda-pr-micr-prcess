import { GoogleGenAI } from "@google/genai";
import { WorkbenchSourceDocument, WorkbenchFlashcard } from '../types';

// Esta interfaz ayuda a TypeScript a entender la biblioteca pdfjs-dist cargada desde el CDN
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

let ai: GoogleGenAI;
const getAI = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }
    return ai;
};

const summarizeFinding = async (query: string, paragraph: string): Promise<string> => {
    if (!paragraph.trim()) return "";
    const ai = getAI();
    const prompt = `
        User Query: "${query}"
        Context Paragraph: "${paragraph}"

        Based on the user's query, provide a concise one or two-sentence summary of the key information from the paragraph.
        This summary will be used as a "flashcard" finding. Extract only the most essential fact or data point relevant to the query.
        Respond with only the summary text, without any introductory phrases.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing finding:", error);
        // Fallback to a truncated version of the paragraph if summarization fails
        return paragraph.length > 250 ? paragraph.substring(0, 247) + "..." : paragraph;
    }
};


// Una función avanzada para leer diferentes tipos de archivos
const readFileContent = async (file: File): Promise<{ filename: string; pages: Array<{ pageNum: number; content: string }> }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        if (file.type === 'application/pdf') {
            reader.onload = async (event) => {
                try {
                    if (!window.pdfjsLib) {
                        throw new Error("La biblioteca PDF (pdf.js) no se ha cargado. Por favor, revise la conexión a internet.");
                    }
                    const typedArray = new Uint8Array(event.target!.result as ArrayBuffer);
                    const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
                    const pages: Array<{ pageNum: number; content: string }> = [];

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        pages.push({ pageNum: i, content: pageText });
                    }
                    resolve({ filename: file.name, pages });
                } catch (e: any) {
                    reject(new Error(`Error al procesar el PDF ${file.name}: ${e.message}`));
                }
            };
            reader.onerror = (error) => reject(new Error(`Error al leer el archivo ${file.name}: ${error}`));
            reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('text/')) {
            reader.onload = () => {
                resolve({ filename: file.name, pages: [{ pageNum: 1, content: reader.result as string }] });
            };
            reader.onerror = (error) => reject(new Error(`Error al leer el archivo ${file.name}: ${error}`));
            reader.readAsText(file);
        } else {
            reject(new Error(`Formato de archivo no soportado: '${file.name}'. Por favor, suba archivos PDF o de texto plano.`));
        }
    });
};

export const WorkbenchService = {
  async search(
    files: File[],
    query: string,
    onProgress: (message: string) => void
  ): Promise<{ sourceDocs: WorkbenchSourceDocument[], flashcards: WorkbenchFlashcard[] }> {

    onProgress('Procesando documentos...');
    const sourceDocs: WorkbenchSourceDocument[] = [];
    const lowerCaseQuery = query.toLowerCase();

    const readPromises = files.map(file => readFileContent(file));
    const settledResults = await Promise.allSettled(readPromises);
    
    const successfulDocs: { filename: string; pages: { pageNum: number; content: string }[] }[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            successfulDocs.push(result.value);
        } else {
            // Lanza el primer error encontrado para notificar al usuario.
            throw result.reason;
        }
    });

    if (successfulDocs.length === 0 && files.length > 0) {
        throw new Error("No se pudo leer ninguno de los archivos. Asegúrese de que sean archivos de texto (.txt, .md) o PDF válidos.");
    }
    
    onProgress('Buscando coincidencias...');
    const potentialFindings: Array<{ sourceDoc: WorkbenchSourceDocument, page: { pageNum: number, content: string }, paragraph: string, pIndex: number }> = [];

    successfulDocs.forEach((docData, docIndex) => {
        const fullContent = docData.pages.map(p => p.content).join('\n\n');
        const sourceDoc: WorkbenchSourceDocument = {
            id: `doc-${docIndex}`,
            filename: docData.filename,
            content: fullContent,
            language: 'es',
            country: 'UNK',
        };
        sourceDocs.push(sourceDoc);

        docData.pages.forEach(page => {
            const paragraphs = page.content.split(/\n\s*\n/);
            paragraphs.forEach((p, pIndex) => {
                if (p.trim() && p.toLowerCase().includes(lowerCaseQuery)) {
                    potentialFindings.push({
                        sourceDoc,
                        page,
                        paragraph: p.trim(),
                        pIndex,
                    });
                }
            });
        });
    });
    
    if (potentialFindings.length === 0) {
        onProgress('No se encontraron coincidencias.');
        await new Promise(resolve => setTimeout(resolve, 500));
        return { sourceDocs, flashcards: [] };
    }

    onProgress(`Encontré ${potentialFindings.length} coincidencias. Generando resúmenes con IA...`);

    const summarizationPromises = potentialFindings.map(finding => 
        summarizeFinding(query, finding.paragraph).then(summary => ({
            ...finding,
            summary: summary || finding.paragraph, // Fallback
        }))
    );
    
    const summarizedFindings = await Promise.all(summarizationPromises);

    onProgress('Compilando resultados finales...');
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate final step

    const flashcards: WorkbenchFlashcard[] = summarizedFindings.map((finding) => ({
        id: `flash-${finding.sourceDoc.id}-p${finding.page.pageNum}-${finding.pIndex}`,
        sourceDocument: finding.sourceDoc,
        pageNumber: finding.page.pageNum,
        citation: finding.summary,
        originalText: finding.paragraph,
        queryMatch: query,
        score: 0.9,
    }));

    return { sourceDocs, flashcards };
  },

  exportNotebook(content: string, format: 'txt' | 'md' | 'docx' | 'pdf') {
    if (format !== 'txt' && format !== 'md') {
        console.warn(`Exportar como ${format.toUpperCase()} no está implementado.`);
        return;
    }
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebook.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};