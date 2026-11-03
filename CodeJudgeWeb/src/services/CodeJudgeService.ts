import {
  LanguageItem,
  TestCase,
  ExecutionResult,
  CompilationResult,
  AnalysisResult,
  OptimizationResult,
  DiagnosticResult,
  HealthStatus,
  AiModelsConfig,
  AiUserPreferences
} from "../types/codejudge";

const CODEJUDGE_API_URL = "http://localhost:8000";
const AI_PREFS_STORAGE_KEY = "codejudge_web_ai_prefs_v1";

export class CodeJudgeService {
  static getStoredAiPreferences(): AiUserPreferences {
    try {
      const raw = localStorage.getItem(AI_PREFS_STORAGE_KEY);
      if (!raw) {
        return { apiKey: "", engine: "", model: "" };
      }
      const parsed = JSON.parse(raw);
      return {
        apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
        engine: typeof parsed.engine === "string" ? parsed.engine : "",
        model: typeof parsed.model === "string" ? parsed.model : ""
      };
    } catch {
      return { apiKey: "", engine: "", model: "" };
    }
  }

  static saveAiPreferences(prefs: AiUserPreferences): void {
    try {
      localStorage.setItem(
        AI_PREFS_STORAGE_KEY,
        JSON.stringify({
          apiKey: (prefs.apiKey || "").trim(),
          engine: (prefs.engine || "").trim(),
          model: (prefs.model || "").trim()
        })
      );
    } catch {
    }
  }

  private static buildAiPayload(): Record<string, string> {
    const prefs = this.getStoredAiPreferences();
    const payload: Record<string, string> = {};
    if (prefs.apiKey.trim()) {
      payload.apiKey = prefs.apiKey.trim();
    }
    if (prefs.engine.trim()) {
      payload.engine = prefs.engine.trim();
    }
    if (prefs.model.trim()) {
      payload.model = prefs.model.trim();
    }
    return payload;
  }

  private static buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const prefs = this.getStoredAiPreferences();
    if (prefs.apiKey.trim()) {
      headers["X-Api-Key"] = prefs.apiKey.trim();
    }
    return headers;
  }

  static async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${CODEJUDGE_API_URL}/health`);
    if (!response.ok) {
      throw new Error("CodeJudgeApp indisponível.");
    }
    return response.json();
  }

  static async getAiModels(): Promise<AiModelsConfig> {
    const response = await fetch(`${CODEJUDGE_API_URL}/ai/models`);
    if (!response.ok) {
      throw new Error("Erro ao obter modelos de IA suportados.");
    }
    return response.json();
  }

  static async getLanguages(): Promise<LanguageItem[]> {
    const response = await fetch(`${CODEJUDGE_API_URL}/languages`);
    if (!response.ok) {
      throw new Error("Erro ao obter linguagens suportadas.");
    }
    const data = await response.json();
    return data.languages || [];
  }

  static async compile(language: string, code: string, statement = ""): Promise<CompilationResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/compilation/run`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ language, code, statement, ...this.buildAiPayload() })
    });
    return response.json();
  }

  static async execute(
    language: string,
    code: string,
    statement = "",
    tests: TestCase[] = []
  ): Promise<ExecutionResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/execution/run`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ language, code, statement, tests, ...this.buildAiPayload() })
    });
    return response.json();
  }

  static async analyze(language: string, code: string, statement = ""): Promise<AnalysisResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/analysis/run`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ language, code, statement, ...this.buildAiPayload() })
    });
    return response.json();
  }

  static async optimize(language: string, code: string, statement = ""): Promise<OptimizationResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/optimization/run`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ language, code, statement, ...this.buildAiPayload() })
    });
    return response.json();
  }

  static async diagnose(
    language: string,
    code: string,
    statement = "",
    logs = "",
    errorType = "compilation"
  ): Promise<DiagnosticResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/diagnostic/run`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ language, code, statement, logs, errorType, ...this.buildAiPayload() })
    });
    return response.json();
  }
}
