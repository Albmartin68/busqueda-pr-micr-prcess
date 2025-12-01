
import { HistoryItem, PlatformTool } from '../types';

declare global {
  interface Window {
    JSZip: any;
  }
}

const STORAGE_KEY = 'platform_history_v1';

class HistoryService {
  
  /**
   * Loads history from LocalStorage
   */
  private load(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  }

  /**
   * Saves history to LocalStorage
   */
  private save(items: HistoryItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save history (Storage might be full)", e);
    }
  }

  /**
   * Add a new item to history
   */
  public addItem(
    tool: PlatformTool, 
    subCategory: string, 
    filename: string, 
    content: string, 
    tags: string[] = []
  ) {
    const items = this.load();
    const newItem: HistoryItem = {
      id: `${tool}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool,
      subCategory,
      filename: filename.endsWith('.txt') || filename.endsWith('.md') ? filename : `${filename}.md`, // Default to MD if no extension
      content,
      timestamp: Date.now(),
      tags
    };
    
    // Add to top, limit to 50 items to prevent overflow in this mock environment
    const updatedItems = [newItem, ...items].slice(0, 50); 
    this.save(updatedItems);
    console.log(`[History] Saved ${tool}/${subCategory}: ${filename}`);
  }

  /**
   * Get all items, optionally filtered
   */
  public getItems(tool?: PlatformTool): HistoryItem[] {
    const items = this.load();
    if (tool) {
      return items.filter(i => i.tool === tool);
    }
    return items;
  }

  /**
   * Generates a ZIP file structure grouping files by Tool -> Subcategory
   * and triggers a download.
   */
  public async downloadHistoryAsZip() {
    if (!window.JSZip) {
      alert("La librería de compresión (JSZip) no está cargada. Por favor, recargue la página.");
      return;
    }

    const zip = new window.JSZip();
    const items = this.load();

    if (items.length === 0) {
      alert("No hay historial para descargar.");
      return;
    }

    // Organize items into folders
    items.forEach(item => {
      // Structure: /Editor_Plus/Auditoria/filename.md
      // sanitize filenames
      const safeTool = item.tool.replace(/\s+/g, '_');
      const safeCat = item.subCategory.replace(/\s+/g, '_');
      const safeName = item.filename.replace(/[^a-z0-9\._-]/gi, '_');

      // Create folder path if not exists (JSZip handles this implicitly)
      const folder = zip.folder(safeTool).folder(safeCat);
      
      // Add text content with timestamp header
      const contentWithMeta = `---
Fecha: ${new Date(item.timestamp).toLocaleString()}
Herramienta: ${item.tool}
Categoría: ${item.subCategory}
---

${item.content}`;

      folder.file(safeName, contentWithMeta);
    });

    try {
      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: "blob" });
      
      // Trigger Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plataforma_Historial_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate ZIP", e);
      alert("Hubo un error al generar el archivo comprimido.");
    }
  }

  public clearHistory() {
      localStorage.removeItem(STORAGE_KEY);
  }
}

export const historyService = new HistoryService();
