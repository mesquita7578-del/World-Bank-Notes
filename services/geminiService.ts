
import { GoogleGenAI, Type } from "@google/genai";
import { Banknote } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Extração básica de dados
  async extractBanknoteData(base64Image: string): Promise<Partial<Banknote> | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType } },
            { text: "Analise esta cédula e extraia os detalhes técnicos em JSON." },
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
              material: { type: Type.STRING },
              size: { type: Type.STRING },
            },
          },
        },
      });

      if (!response.text) return null;
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Extraction Error:", error);
      throw error;
    }
  }

  // NOVO: Estimativa de valor comercial via IA com Busca no Google
  async estimateMarketValue(note: Partial<Banknote>): Promise<string | null> {
    try {
      // Usamos gemini-3-pro-preview para tarefas complexas de raciocínio e busca
      const prompt = `Qual o valor de mercado aproximado em Euros (€) para esta cédula: 
      País: ${note.country}
      Denominação: ${note.denomination} ${note.currency}
      Ano/Emissão: ${note.issueDate}
      Pick ID: ${note.pickId}
      Estado de Conservação: ${note.grade} (MUITO IMPORTANTE PARA O PREÇO)
      
      Retorne apenas o valor numérico (ex: 45.00 ou 1200.50). Se for um intervalo, retorne a média. 
      Se não encontrar, retorne nulo.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text?.trim() || "";
      const match = text.match(/\d+(\.\d+)?/);
      return match ? match[0] : null;
    } catch (error) {
      console.error("Market Valuation Error:", error);
      return null;
    }
  }

  async getHistoricalContext(note: Banknote): Promise<{ text: string, sources: any[] }> {
    try {
      const prompt = `Fatos históricos e raridade: ${note.denomination} ${note.currency} - ${note.country} (${note.pickId}).`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      return {
        text: response.text || "Sem dados históricos.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      return { text: "Erro na pesquisa.", sources: [] };
    }
  }

  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
          { text: prompt },
        ],
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }
}

export const geminiService = new GeminiService();
