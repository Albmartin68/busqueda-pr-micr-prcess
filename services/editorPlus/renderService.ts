// This service will handle rendering documents to different formats like PDF.
// It simulates the 'render-service' (Cloud Run Job) from the proposed GCP architecture.

// Declare jsPDF and html2canvas for TypeScript since they are loaded from CDN
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

class RenderService {
  /**
   * Exports the content of an HTML element to a PDF file.
   * @param element - The HTML element to be rendered into the PDF.
   * @param onProgress - A callback to provide progress updates to the UI.
   */
  public async exportToPdf(element: HTMLElement, onProgress: (message: string) => void): Promise<void> {
    if (!window.jspdf || !window.html2canvas) {
        throw new Error("PDF rendering libraries not loaded.");
    }
    
    onProgress("Generando el PDF en la nube...");

    // Simulate network delay and processing time of a backend service
    await new Promise(resolve => setTimeout(resolve, 2500)); 

    const { jsPDF } = window.jspdf;
    
    const canvas = await window.html2canvas(element, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff' 
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ 
      orientation: 'p', 
      unit: 'mm', 
      format: 'a4' 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save("editor-plus-documento.pdf");
  }
}

export const renderService = new RenderService();