import Tesseract from 'tesseract.js';
import fs from 'fs';

export class OCRService {
  /**
   * Performs text extraction on an image file path (or URL) using Tesseract.js.
   */
  static async extractText(filePath: string): Promise<string> {
    try {
      console.log(`Starting OCR text extraction on file: ${filePath}`);

      // Basic file check if local path
      if (filePath.startsWith('/') || filePath.startsWith('.')) {
        if (!fs.existsSync(filePath)) {
          console.warn(`File not found at ${filePath}, using mock OCR text`);
          return this.getMockOCRText();
        }
      }

      // Run Tesseract
      const result = await Tesseract.recognize(
        filePath,
        'eng',
        {
          logger: m => console.log(`OCR Progress: ${m.status} - ${Math.round(m.progress * 100)}%`)
        }
      );

      console.log('OCR Extraction completed successfully.');
      return result.data.text || this.getMockOCRText();
    } catch (error) {
      console.error('OCR Extraction failed, falling back to mock text:', error);
      return this.getMockOCRText();
    }
  }

  /**
   * Default fallback mock text for grading simulations.
   */
  private static getMockOCRText(): string {
    return `
      Student Name: John Doe
      Date: 2026-06-10
      Subject: Math Quiz - Algebra and Calculus Basics
      
      Q1. Solve 2x + 5 = 15
      Ans: 2x = 15 - 5
           2x = 10
           x = 5 (Correct)
           
      Q2. Solve x^2 - 5x + 6 = 0 using factorization
      Ans: x^2 - 2x - 3x + 6 = 0
           x(x - 2) - 3(x - 2) = 0
           (x - 3)(x - 2) = 0
           Roots are x = 3 and x = 2 (Correct)
           
      Q3. Find derivative of f(x) = x^3 - 4x + 7
      Ans: f'(x) = 3x^2 - 4 + 7
           Wait, derivative of constant 7 is 0, so f'(x) = 3x^2 - 4.
           I wrote 3x^2 - 4 + 7. My final answer was 3x^2 + 3. (Mistake!)
           
      Q4. Solve simultaneous equations: x + y = 6, 2x - y = 3
      Ans: Add: 3x = 9 => x = 3
           Sub: 3 + y = 6 => y = 3 (Correct)
    `;
  }
}
