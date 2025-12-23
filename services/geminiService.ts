
import { GoogleGenAI, Type } from "@google/genai";
import { Banknote } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Uses gemini-3-flash-preview for structured data extraction from images
  async extractBanknoteData(base64Image: string): Promise<Partial<Banknote> | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: "Analise esta cédula (banknote) e extraia todos os detalhes técnicos possíveis. Retorne os dados estritamente em formato JSON seguindo as propriedades especificadas.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pickId: { type: Type.STRING },
              country: { type: Type.STRING },
              authority: { type: Type.STRING },
              currency: { type: Type.STRING },
              denomination: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              type: { type: Type.STRING },
              material: { type: Type.STRING },
              size: { type: Type.STRING },
              comments: { type: Type.STRING },
              itemsInSet: { type: Type.STRING },
              setItemNumber: { type: Type.STRING },
              setDetails: { type: Type.STRING },
            },
          },
        },
      });

      if (!response.text) return null;
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      throw error;
    }
  }

  // Uses gemini-3-flash-preview with googleSearch tool for historical context
  async getHistoricalContext(note: Banknote): Promise<{ text: string, sources: any[] }> {
    try {
      const prompt = `Forneça um contexto histórico detalhado, raridade e curiosidades sobre a cédula: ${note.denomination} ${note.currency} de ${note.country}, emitida em ${note.issueDate}. Use o Pick ID ${note.pickId} se disponível para maior precisão.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      // Extract URLs from groundingChunks as required by guidelines
      return {
        text: response.text || "Informação não disponível.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      console.error("Gemini Search Error:", error);
      return { text: "Erro ao pesquisar informações na web.", sources: [] };
    }
  }

  // Uses gemini-2.5-flash-image for image restoration/editing
  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType } },
            { text: `Restaurar imagem numismática: ${prompt}` },
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Find and return the processed image part
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Image Edit Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
