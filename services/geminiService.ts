
import { GoogleGenAI, Type } from "@google/genai";
import { Banknote } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * SUPER EXTRAÇÃO: Identifica a cédula pela imagem e busca valor de mercado em tempo real.
   */
  async extractBanknoteData(base64Image: string): Promise<Partial<Banknote> | null> {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/png';

      // Usamos o Gemini 3 Pro para permitir o uso de Google Search durante a extração
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType } },
            { text: `Analise profundamente esta imagem de cédula. 
              1. Identifique todos os detalhes técnicos (Pick ID, País, Autoridade, Moeda, Valor, Ano, Material, Tamanho).
              2. Use o Google Search para encontrar o valor comercial médio atual em Euros (€) para este item no mercado numismático.
              3. Identifique se ela faz parte de uma série/conjunto específico.
              Retorne os dados estritamente no formato JSON definido.` 
            },
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pickId: { type: Type.STRING, description: "O número de catálogo Pick/Standard Catalog" },
              country: { type: Type.STRING, description: "País emissor" },
              authority: { type: Type.STRING, description: "Banco Central ou Autoridade" },
              currency: { type: Type.STRING, description: "Nome da moeda" },
              denomination: { type: Type.STRING, description: "Valor nominal numérico" },
              issueDate: { type: Type.STRING, description: "Ano ou data completa de emissão" },
              material: { type: Type.STRING, description: "Papel, Polímero ou Híbrido" },
              size: { type: Type.STRING, description: "Dimensões aproximadas em mm" },
              estimatedValue: { type: Type.STRING, description: "Valor de mercado estimado em EUR (apenas números)" },
              type: { type: Type.STRING, description: "Circulação, Comemorativa, Espécime, etc." },
              setDetails: { type: Type.STRING, description: "Breve descrição da série ou conjunto se aplicável" },
              comments: { type: Type.STRING, description: "Uma breve curiosidade histórica ou detalhe de raridade encontrado na busca" }
            },
          },
        },
      });

      if (!response.text) return null;
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Super Extraction Error:", error);
      throw error;
    }
  }

  async estimateMarketValue(note: Partial<Banknote>): Promise<string | null> {
    try {
      const prompt = `Qual o valor de mercado aproximado em Euros (€) para esta cédula: 
      País: ${note.country}, Denominação: ${note.denomination} ${note.currency}, Ano: ${note.issueDate}, Pick ID: ${note.pickId}, Conservação: ${note.grade}.
      Retorne apenas o valor numérico médio.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const text = response.text?.trim() || "";
      const match = text.match(/\d+(\.\d+)?/);
      return match ? match[0] : null;
    } catch (error) {
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
