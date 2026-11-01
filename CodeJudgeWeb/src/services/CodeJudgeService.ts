import {
  LanguageItem,
  TestCase,
  ExecutionResult,
  CompilationResult,
  AnalysisResult,
  OptimizationResult,
  DiagnosticResult,
  HealthStatus
} from "../types/codejudge";

const CODEJUDGE_API_URL = "http://localhost:8000";

export class CodeJudgeService {
  static async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${CODEJUDGE_API_URL}/health`);
    if (!response.ok) {
      throw new Error("CodeJudgeApp indisponível.");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, statement })
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, statement, tests })
    });
    return response.json();
  }

  static async analyze(language: string, code: string, statement = ""): Promise<AnalysisResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/analysis/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, statement })
    });
    return response.json();
  }

  static async optimize(language: string, code: string, statement = ""): Promise<OptimizationResult> {
    const response = await fetch(`${CODEJUDGE_API_URL}/optimization/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, statement })
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, statement, logs, errorType })
    });
    return response.json();
  }
}
