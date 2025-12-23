
import { GoogleGenAI, Type } from "@google/genai";
import { Banknote } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async extractBanknoteData(base64Image: string): Promise<Partial<Banknote> | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
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
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pickId: { type: Type.STRING, description: "Identificação da Escolha / Pick Number" },
              country: { type: Type.STRING, description: "País de origem" },
              authority: { type: Type.STRING, description: "Autoridade emissora (ex: Banco Central)" },
              currency: { type: Type.STRING, description: "Nome da moeda" },
              denomination: { type: Type.STRING, description: "Valor nominal / Denominação" },
              issueDate: { type: Type.STRING, description: "Data de emissão que consta na nota" },
              type: { type: Type.STRING, description: "Tipo (Circulação, Comemorativa, Espécime)" },
              material: { type: Type.STRING, description: "Material (Papel, Polímero ou Híbrido)" },
              size: { type: Type.STRING, description: "Dimensões aproximadas" },
              comments: { type: Type.STRING, description: "Descrição breve dos elementos visuais" },
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

  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `Restaurar ou editar esta imagem de nota de banco seguindo esta instrução: ${prompt}. Mantenha os detalhes numismáticos o mais originais possível, focando em melhorar a visibilidade e qualidade.`,
            },
          ],
        },
      });

      if (!response.candidates?.[0]?.content?.parts) return null;

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
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
