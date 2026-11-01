import { PromptDocument, PromptListResponse } from "../types/prompts";

const CODEJUDGE_API_URL = "http://localhost:8000";

export class PromptService {
  static async getAll(): Promise<PromptDocument[]> {
    const response = await fetch(`${CODEJUDGE_API_URL}/prompts/all`);
    if (!response.ok) {
      throw new Error("Erro ao carregar catálogo de prompts.");
    }
    const data: PromptListResponse = await response.json();
    return data.templates || [];
  }

  static async getByCategory(category: string): Promise<PromptDocument[]> {
    const response = await fetch(`${CODEJUDGE_API_URL}/prompts/category/${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`Erro ao carregar prompts da categoria ${category}.`);
    }
    const data: PromptListResponse = await response.json();
    return data.templates || [];
  }

  static async getSingle(category: string, name: string): Promise<PromptDocument> {
    const response = await fetch(
      `${CODEJUDGE_API_URL}/prompts/single/${encodeURIComponent(category)}/${encodeURIComponent(name)}`
    );
    if (!response.ok) {
      throw new Error(`Erro ao carregar prompt ${name}.`);
    }
    return response.json();
  }
}
