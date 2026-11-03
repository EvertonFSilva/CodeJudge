export interface LanguageItem {
  key: string;
  name: string;
  sourceExtension: string;
  targetExtension: string;
  needsCompilation: boolean;
}

export interface TestCase {
  input: string;
  expected: string;
}

export interface ScenarioOutcome {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  inputs?: string[];
  outputs?: ScenarioOutcome[];
  rate?: number | null;
  durationMs?: number | null;
  rawOutput?: string;
  details?: Record<string, unknown>;
}

export interface CompilationResult {
  success: boolean;
  message: string;
  sourcePath?: string | null;
  logs?: string;
  durationMs?: number | null;
  details?: Record<string, unknown>;
}

export interface AnalysisResult {
  success: boolean;
  message: string;
  feedback?: string | null;
  durationMs?: number | null;
}

export interface OptimizationResult {
  success: boolean;
  message: string;
  recommendations?: string | null;
  durationMs?: number | null;
}

export interface DiagnosticResult {
  success: boolean;
  feedback: string;
}

export interface HealthStatus {
  status: string;
  compilers: Record<string, unknown>;
  ai: Record<string, unknown>;
}

export interface AiEngineItem {
  key: string;
  name: string;
  adapter: string;
  defaultModel: string;
  supportedModels: string[];
  requiresApiKey: boolean;
  isDefault: boolean;
}

export interface AiModelsConfig {
  success: boolean;
  isUserKeyRequired: boolean;
  allowUserKeyOverride?: boolean;
  defaultEngine: string;
  defaultModel: string;
  models: string[];
  providers: Record<string, string[]>;
  engines: AiEngineItem[];
}

export interface AiUserPreferences {
  apiKey: string;
  engine: string;
  model: string;
}
