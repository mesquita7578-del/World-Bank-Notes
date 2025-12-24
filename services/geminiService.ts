
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
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType } },
            { text: `Analise profundamente esta imagem de cédula. 
              1. Identifique os detalhes técnicos (Pick ID, País, Continente, Autoridade, Moeda, Valor, Ano, Material, Tamanho).
              2. Se a cédula for do BRASIL, use obrigatoriamente como referência técnica o site oficial: https://www.bcb.gov.br/cedulasemoedas/cedulasemitidas.
              3. Extraia também: Ministro(a) da Fazenda, Presidente do Banco Central, Estampa, Série Normal e Série de Reposição.
              4. Use o Google Search para encontrar o valor comercial médio atual em Euros (€).
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
              pickId: { type: Type.STRING },
              country: { type: Type.STRING },
              continent: { type: Type.STRING, description: "África, América, Ásia, Europa ou Oceania" },
              authority: { type: Type.STRING },
              currency: { type: Type.STRING },
              denomination: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              material: { type: Type.STRING },
              size: { type: Type.STRING },
              estimatedValue: { type: Type.STRING },
              type: { type: Type.STRING },
              setDetails: { type: Type.STRING },
              comments: { type: Type.STRING },
              minister: { type: Type.STRING },
              president: { type: Type.STRING },
              stamp: { type: Type.STRING },
              seriesNormal: { type: Type.STRING },
              seriesReplacement: { type: Type.STRING }
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
      const prompt = `Qual o valor de mercado aproximado em Euros (€) para esta cédula: País: ${note.country}, Denominação: ${note.denomination} ${note.currency}, Ano: ${note.issueDate}, Pick ID: ${note.pickId}, Conservação: ${note.grade}. Retorne apenas o valor numérico médio.`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      const match = (response.text || "").match(/\d+(\.\d+)?/);
      return match ? match[0] : null;
    } catch (error) { return null; }
  }

  async getHistoricalContext(note: Banknote): Promise<{ text: string, sources: any[] }> {
    try {
      const prompt = `Fatos históricos, raridade e contexto: ${note.denomination} ${note.currency} - ${note.country} (${note.pickId}). Se for do Brasil, use bcb.gov.br.`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      return { text: response.text || "Sem dados.", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    } catch (error) { return { text: "Erro.", sources: [] }; }
  }

  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { data: cleanBase64, mimeType: 'image/png' } }, { text: prompt }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }
}

export const geminiService = new GeminiService();
