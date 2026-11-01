import { PromptDocument, PromptListResponse } from "../types/prompts";

const CODEJUDGE_API_URL = "http://localhost:8000";

export class PromptService {
  static async getAll(): Promise<PromptDocument[]> {
    const response = await fetch(`${CODEJUDGE_API_URL}/prompts/all`);
    if (!response.ok) {
      throw new Error("Erro ao carregar catálogo de prompts do CodeJudgeApp.");
    }
    const data: PromptListResponse = await response.json();
    const result: PromptDocument[] = [];

    if (data && data.templates) {
      for (const [category, items] of Object.entries(data.templates)) {
        if (typeof items === "object" && items !== null) {
          for (const [key, val] of Object.entries(items)) {
            result.push({
              key,
              category,
              name: val?.metadata?.name || key,
              description: val?.metadata?.description || "",
              content: val?.content || ""
            });
          }
        }
      }
    }
    return result;
  }

  static async getByCategory(category: string): Promise<PromptDocument[]> {
    const all = await this.getAll();
    return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  static async getSingle(category: string, name: string): Promise<PromptDocument | null> {
    const all = await this.getAll();
    const found = all.find(
      (p) => p.category.toLowerCase() === category.toLowerCase() && p.key.toLowerCase() === name.toLowerCase()
    );
    return found || null;
  }
}
