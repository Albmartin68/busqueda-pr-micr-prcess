import { generateImageCaption, extractTextFromImage as ocrService } from '../geminiService';

// This service handles asset management, like image processing, compression, and metadata generation.
// It simulates the 'asset-service' microservice (Cloud Functions) from the proposed GCP architecture.

class AssetService {

  /**
   * Compresses an image file in the browser.
   * @param file - The image file to compress.
   * @returns A Promise that resolves with the compressed image as a data URL.
   */
  private async compressImage(file: File): Promise<string> {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Max width for images in the document
          const scaleSize = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(file.type, 0.8)); // 80% quality compression
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Creates the HTML string for a figure element.
   * @param src - The image source URL.
   * @param caption - The text for the figcaption.
   * @returns An HTML string representing the figure.
   */
  public createFigureHtml(src: string, caption: string): string {
    const figureId = `fig-${Date.now()}`;
    // The wrapper div is necessary to handle clicks without triggering the parent contentEditable context
    return `
      <div contenteditable="false">
        <figure id="${figureId}">
            <img src="${src}" alt="${caption}" />
            <figcaption contenteditable="true">${caption}</figcaption>
        </figure>
      </div>
    `;
  }

  /**
   * Processes a new image file by compressing it, generating a caption,
   * and returning the final HTML for insertion into the editor.
   * @param file - The new image file uploaded by the user.
   * @returns A Promise that resolves with the full HTML string for the figure.
   */
  public async processNewImage(file: File): Promise<string> {
    // 1. Compress image
    const compressedDataUrl = await this.compressImage(file);

    // 2. Generate caption with Gemini API
    const base64Image = compressedDataUrl.split(',')[1];
    const captionText = await generateImageCaption(base64Image, file.type);

    // 3. Create the final HTML
    return this.createFigureHtml(compressedDataUrl, captionText);
  }

  /**
   * Extracts text from an image file using an OCR service.
   * @param file - The image file to process.
   * @returns A promise that resolves with the extracted text.
   */
  public async extractTextFromImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64Image = (event.target?.result as string).split(',')[1];
                const text = await ocrService(base64Image, file.type);
                resolve(text);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
  }
}

export const assetService = new AssetService();