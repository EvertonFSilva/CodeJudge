import React, { useEffect, useState, useRef } from "react";
import { UserProfile } from "../types/auth";
import {
  LanguageItem,
  TestCase,
  ExecutionResult,
  CompilationResult,
  AnalysisResult,
  OptimizationResult
} from "../types/codejudge";
import { CodeJudgeService } from "../services/CodeJudgeService";
import { LanguageDetectionService } from "../services/LanguageDetectionService";
import { PdfExportService } from "../services/PdfExportService";
import { TestResultsTable } from "../components/TestResultsTable";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface JudgePageProps {
  user: UserProfile | null;
}

type OperationMode = "full" | "compile" | "execute" | "analyze" | "optimize";
type StepStatus = "pending" | "running" | "success" | "failed";

export const JudgePage: React.FC<JudgePageProps> = ({ user }) => {
  const [availableLanguages, setAvailableLanguages] = useState<LanguageItem[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>("main.c");
  const [code, setCode] = useState<string>(
    '#include <stdio.h>\n\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}\n'
  );
  const [statement, setStatement] = useState<string>("");
  const [mode, setMode] = useState<OperationMode>("full");

  // Detected language (automatically determined, never forced upon the user)
  const [detectedLang, setDetectedLang] = useState<LanguageItem>({
    key: "c",
    name: "C",
    sourceExtension: ".c",
    targetExtension: ".exe",
    needsCompilation: true
  });

  // Test cases & file inputs
  const [inputsFileText, setInputsFileText] = useState<string>("10 20\n-5 15");
  const [outputsFileText, setOutputsFileText] = useState<string>("30\n10");
  const [inputsFileName, setInputsFileName] = useState<string>("inputs.txt");
  const [outputsFileName, setOutputsFileName] = useState<string>("outputs.txt");
  const [hasInputFile, setHasInputFile] = useState<boolean>(true);
  const [hasOutputFile, setHasOutputFile] = useState<boolean>(true);
  const [showInputPreview, setShowInputPreview] = useState<boolean>(false);
  const [showOutputPreview, setShowOutputPreview] = useState<boolean>(false);

  // Stepper state
  const [stepCompileStatus, setStepCompileStatus] = useState<StepStatus>("pending");
  const [stepExecuteStatus, setStepExecuteStatus] = useState<StepStatus>("pending");
  const [stepAnalyzeStatus, setStepAnalyzeStatus] = useState<StepStatus>("pending");
  const [stepOptimizeStatus, setStepOptimizeStatus] = useState<StepStatus>("pending");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processGlobalStatus, setProcessGlobalStatus] = useState<string>("Aguardando execução...");

  // Results
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showConsolidatedMd, setShowConsolidatedMd] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const outputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await CodeJudgeService.getLanguages();
        setAvailableLanguages(langs);
        const auto = LanguageDetectionService.detectFromCode(code, langs);
        setDetectedLang(auto);
      } catch {
        // Fallback languages are already available in LanguageDetectionService
      }
    };
    fetchLanguages();
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const detected = LanguageDetectionService.detectFromCode(newCode, availableLanguages);
    setDetectedLang(detected);
    if (!activeFileName || activeFileName.startsWith("editor.") || activeFileName.startsWith("main.")) {
      setActiveFileName(`main${detected.sourceExtension}`);
    }
  };

  const handleSourceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveFileName(file.name);
    const byFile = LanguageDetectionService.detectFromFileName(file.name, availableLanguages);
    if (byFile) {
      setDetectedLang(byFile);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      setCode(content);
      if (!byFile) {
        const byCode = LanguageDetectionService.detectFromCode(content, availableLanguages);
        setDetectedLang(byCode);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleInputsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputsFileName(file.name);
    setHasInputFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputsFileText((event.target?.result as string) || "");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleOutputsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOutputsFileName(file.name);
    setHasOutputFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setOutputsFileText((event.target?.result as string) || "");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseTestCases = (): TestCase[] => {
    if (!hasInputFile && !hasOutputFile) return [];

    const inSeparator = inputsFileText.includes("---") ? "---" : "\n";
    const outSeparator = outputsFileText.includes("---") ? "---" : "\n";

    const inList = inputsFileText.split(inSeparator).map((s) => s.trim()).filter((s) => s.length > 0);
    const outList = outputsFileText.split(outSeparator).map((s) => s.trim()).filter((s) => s.length > 0);

    const maxLen = Math.max(inList.length, outList.length);
    const tests: TestCase[] = [];
    for (let i = 0; i < maxLen; i++) {
      tests.push({
        input: inList[i] || "",
        expected: outList[i] || ""
      });
    }
    return tests;
  };

  const handleRunProcess = async () => {
    if (!code.trim()) {
      setErrorMessage("O código-fonte está vazio. Digite ou carregue um arquivo.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCompilationResult(null);
    setExecutionResult(null);
    setAnalysisResult(null);
    setOptimizationResult(null);
    setShowConsolidatedMd(false);

    // Reset steppers
    setStepCompileStatus(detectedLang.needsCompilation ? "pending" : "success");
    setStepExecuteStatus("pending");
    setStepAnalyzeStatus("pending");
    setStepOptimizeStatus("pending");
    setProcessGlobalStatus("Iniciando processamento...");

    try {
      const tests = parseTestCases();

      // 1. COMPILATION STAGE
      if (mode === "full" || mode === "compile") {
        if (detectedLang.needsCompilation) {
          setStepCompileStatus("running");
          setProcessGlobalStatus("Compilando código-fonte...");
          const compRes = await CodeJudgeService.compile(detectedLang.key, code, statement);
          setCompilationResult(compRes);

          if (!compRes.success) {
            setStepCompileStatus("failed");
            setProcessGlobalStatus("Interrompido por erro de compilação.");
            setIsProcessing(false);
            return;
          }
          setStepCompileStatus("success");
        } else {
          setStepCompileStatus("success");
        }
      }

      // 2. EXECUTION STAGE
      if (mode === "full" || mode === "execute") {
        setStepExecuteStatus("running");
        setProcessGlobalStatus("Executando casos de teste em sandbox...");
        const execRes = await CodeJudgeService.execute(detectedLang.key, code, statement, tests);
        setExecutionResult(execRes);
        setStepExecuteStatus(execRes.success ? "success" : "failed");
      }

      // 3. AI ANALYSIS STAGE
      if (mode === "full" || mode === "analyze") {
        setStepAnalyzeStatus("running");
        setProcessGlobalStatus("Consultando IA para análise de boas práticas...");
        const anaRes = await CodeJudgeService.analyze(detectedLang.key, code, statement);
        setAnalysisResult(anaRes);
        setStepAnalyzeStatus(anaRes.success ? "success" : "failed");
      }

      // 4. AI OPTIMIZATION STAGE
      if (mode === "full" || mode === "optimize") {
        setStepOptimizeStatus("running");
        setProcessGlobalStatus("Consultando IA para análise de complexidade assintótica...");
        const optRes = await CodeJudgeService.optimize(detectedLang.key, code, statement);
        setOptimizationResult(optRes);
        setStepOptimizeStatus(optRes.success ? "success" : "failed");
      }

      setProcessGlobalStatus("Processamento concluído com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao comunicar com a API do CodeJudge.";
      setErrorMessage(msg);
      setProcessGlobalStatus("Falha na execução.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPdf = () => {
    PdfExportService.exportReport({
      userProfile: user,
      fileName: activeFileName,
      language: detectedLang.key,
      statement,
      code,
      compilation: compilationResult,
      execution: executionResult,
      analysis: analysisResult,
      optimization: optimizationResult
    });
  };

  const buildConsolidatedMarkdown = (): string => {
    let md = `# Relatório de Avaliação - CodeJudge\n\n`;
    md += `**Arquivo:** \`${activeFileName}\`  \n`;
    md += `**Linguagem Detectada:** ${detectedLang.name} (${detectedLang.sourceExtension})  \n`;
    md += `**Estudante:** ${user?.name || "Estudante"}  \n`;
    md += `**Instituição:** ${user?.campus || "Moodle IFF"}  \n\n`;

    if (statement && statement.trim()) {
      md += `## Enunciado\n${statement}\n\n`;
    }

    if (compilationResult) {
      md += `## 1. Compilação\n`;
      md += `Status: **${compilationResult.success ? "Sucesso" : "Falha"}**\n`;
      if (compilationResult.logs) {
        md += `\`\`\`text\n${compilationResult.logs}\n\`\`\`\n\n`;
      }
    }

    if (executionResult) {
      md += `## 2. Execução\n`;
      md += `Taxa de Acerto: **${executionResult.rate ?? "N/A"}%**\n\n`;
    }

    if (analysisResult?.feedback) {
      md += `## 3. Diagnóstico e Boas Práticas (IA)\n\n${analysisResult.feedback}\n\n`;
    }

    if (optimizationResult?.recommendations) {
      md += `## 4. Otimização Assintótica (IA)\n\n${optimizationResult.recommendations}\n\n`;
    }

    return md;
  };

  const hasAnyResult = Boolean(compilationResult || executionResult || analysisResult || optimizationResult);

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Top Bar with Title and Prominent PDF Export Button */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 border-bottom border-secondary-subtle pb-3">
        <div>
          <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Bancada de Processamento e Avaliação
          </h4>
          <p className="text-secondary small mb-0">
            Compilação, execução em sandbox com gabaritos e diagnósticos formativos com Inteligência Artificial.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {hasAnyResult && (
            <button
              type="button"
              className="btn btn-report-action-pdf shadow-sm d-flex align-items-center gap-2"
              onClick={handleExportPdf}
              title="Gerar e fazer download do relatório completo em PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Gerar Relatório (.pdf)</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5 text-danger flex-shrink-0"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Code, Active File & Test Inputs */}
        <div className="col-lg-7">
          {/* Active File Card with Automatic Language Detection Badge */}
          <div className="active-file-card">
            <div className="file-details">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>{activeFileName}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary small">Linguagem Identificada:</span>
              <span className="lang-badge">
                {detectedLang.name} ({detectedLang.sourceExtension})
              </span>
            </div>
          </div>

          {/* Operation Mode Selector */}
          <div className="dark-card mb-4">
            <div className="dark-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold text-light small">Modo de Operação:</span>
                <select
                  className="form-select form-select-sm dark-input"
                  style={{ width: "auto" }}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as OperationMode)}
                  disabled={isProcessing}
                >
                  <option value="full">Processamento Completo (Recomendado)</option>
                  <option value="compile">Apenas Compilar</option>
                  <option value="execute">Apenas Executar</option>
                  <option value="analyze">Apenas Analisar Código</option>
                  <option value="optimize">Apenas Otimizar Código</option>
                </select>
              </div>

              <div className="d-flex align-items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  onChange={handleSourceFileUpload}
                  accept=".c,.cpp,.cc,.cxx,.h,.hpp,.java,.py,.txt"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  title="Carregar arquivo de código"
                >
                  <i className="bi bi-upload"></i>
                  <span>Carregar Arquivo</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleCodeChange("")}
                  title="Limpar código"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>

            {/* Problem Statement (Optional) */}
            <div className="p-3 border-bottom border-secondary-subtle" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-secondary mb-0">
                  Enunciado da Questão
                </label>
                <span className="badge bg-secondary-subtle text-secondary small">Opcional</span>
              </div>
              <textarea
                className="form-control dark-textarea small"
                rows={2}
                placeholder="Cole aqui o enunciado ou requisitos da questão para contextualizar o relatório e a IA..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                disabled={isProcessing}
              ></textarea>
            </div>

            {/* Source Code Editor */}
            <div className="p-0">
              <textarea
                className="code-editor-area"
                rows={15}
                placeholder="// Digite ou cole seu código-fonte aqui... A linguagem será identificada automaticamente!"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isProcessing}
                spellCheck={false}
              ></textarea>
            </div>

            {/* Execute Button */}
            <div className="p-3 border-top border-secondary-subtle d-flex justify-content-between align-items-center">
              <span className="text-secondary small">
                {code.split("\n").length} linhas &bull; {code.length} caracteres
              </span>

              <button
                type="button"
                className="main-execute-btn"
                onClick={handleRunProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>
                      {mode === "full"
                        ? "Processar Código (Executar Tudo)"
                        : mode === "compile"
                        ? "Compilar Código"
                        : mode === "execute"
                        ? "Executar Casos de Teste"
                        : mode === "analyze"
                        ? "Analisar Código (IA)"
                        : "Otimizar Código (IA)"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test cases panel (inputs.txt and outputs.txt) */}
          {(mode === "full" || mode === "execute") && (
            <div className="dark-card mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span className="fw-semibold text-light small">Arquivos de Teste (inputs.txt e outputs.txt)</span>
                </div>
                <span className="badge bg-secondary-subtle text-secondary small">Opcional</span>
              </div>

              <div className="dark-card-body">
                <div className="row g-3">
                  {/* Inputs */}
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-secondary fw-semibold">Entradas ({inputsFileName}):</span>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-success"
                          onClick={() => setShowInputPreview(!showInputPreview)}
                        >
                          {showInputPreview ? "Ocultar" : "Ver conteúdo"}
                        </button>
                        <input
                          type="file"
                          ref={inputFileRef}
                          className="d-none"
                          onChange={handleInputsUpload}
                          accept=".txt"
                        />
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-light"
                          onClick={() => inputFileRef.current?.click()}
                        >
                          Carregar .txt
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="form-control dark-textarea font-monospace small"
                      rows={showInputPreview ? 5 : 2}
                      value={inputsFileText}
                      onChange={(e) => setInputsFileText(e.target.value)}
                      placeholder="Entradas do programa (stdin)"
                    ></textarea>
                  </div>

                  {/* Outputs */}
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-secondary fw-semibold">Gabarito ({outputsFileName}):</span>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-success"
                          onClick={() => setShowOutputPreview(!showOutputPreview)}
                        >
                          {showOutputPreview ? "Ocultar" : "Ver conteúdo"}
                        </button>
                        <input
                          type="file"
                          ref={outputFileRef}
                          className="d-none"
                          onChange={handleOutputsUpload}
                          accept=".txt"
                        />
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-light"
                          onClick={() => outputFileRef.current?.click()}
                        >
                          Carregar .txt
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="form-control dark-textarea font-monospace small"
                      rows={showOutputPreview ? 5 : 2}
                      value={outputsFileText}
                      onChange={(e) => setOutputsFileText(e.target.value)}
                      placeholder="Saídas esperadas (stdout)"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stepper, Summary Banner, Results & Feedback */}
        <div className="col-lg-5">
          {/* Stepper Card */}
          <div className="stepper-card">
            <div className="stepper-header">
              <span>Progresso das Etapas</span>
              <span className="text-secondary font-monospace">{processGlobalStatus}</span>
            </div>

            <div className="stepper-list">
              <div className={`step-item ${stepCompileStatus === "running" ? "active" : ""}`}>
                <span className="step-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 18l6-6-6-6"></path>
                    <path d="M8 6l-6 6 6 6"></path>
                  </svg>
                  1. Compilação
                </span>
                <span className={`step-status-tag ${stepCompileStatus}`}>
                  {stepCompileStatus === "pending"
                    ? "Pendente"
                    : stepCompileStatus === "running"
                    ? "Compilando..."
                    : stepCompileStatus === "success"
                    ? "Concluído"
                    : "Falha"}
                </span>
              </div>

              <div className={`step-item ${stepExecuteStatus === "running" ? "active" : ""}`}>
                <span className="step-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  2. Execução de Testes
                </span>
                <span className={`step-status-tag ${stepExecuteStatus}`}>
                  {stepExecuteStatus === "pending"
                    ? "Pendente"
                    : stepExecuteStatus === "running"
                    ? "Executando..."
                    : stepExecuteStatus === "success"
                    ? "Concluído"
                    : "Falha"}
                </span>
              </div>

              <div className={`step-item ${stepAnalyzeStatus === "running" ? "active" : ""}`}>
                <span className="step-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  3. Análise de Código (IA)
                </span>
                <span className={`step-status-tag ${stepAnalyzeStatus}`}>
                  {stepAnalyzeStatus === "pending"
                    ? "Pendente"
                    : stepAnalyzeStatus === "running"
                    ? "Analisando..."
                    : stepAnalyzeStatus === "success"
                    ? "Concluído"
                    : "Falha"}
                </span>
              </div>

              <div className={`step-item ${stepOptimizeStatus === "running" ? "active" : ""}`}>
                <span className="step-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  4. Otimização Assintótica (IA)
                </span>
                <span className={`step-status-tag ${stepOptimizeStatus}`}>
                  {stepOptimizeStatus === "pending"
                    ? "Pendente"
                    : stepOptimizeStatus === "running"
                    ? "Otimizando..."
                    : stepOptimizeStatus === "success"
                    ? "Concluído"
                    : "Falha"}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Banner when completed */}
          {hasAnyResult && (
            <div className="summary-banner">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold text-white fs-6">Processamento Concluído</div>
                  <div className="text-secondary small">
                    O relatório técnico está pronto. Escolha como deseja visualizá-lo:
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-report-action"
                  onClick={() => setShowConsolidatedMd(!showConsolidatedMd)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span>{showConsolidatedMd ? "Ocultar (.md)" : "Visualizar (.md)"}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-report-action btn-report-action-pdf"
                  onClick={handleExportPdf}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Gerar Relatório (.pdf)</span>
                </button>
              </div>
            </div>
          )}

          {/* Consolidated Markdown Modal or View */}
          {showConsolidatedMd && (
            <div className="dark-card mt-4 mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <span className="fw-bold text-light small">Relatório Consolidado (.md)</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-0"
                  onClick={() => setShowConsolidatedMd(false)}
                >
                  Fechar
                </button>
              </div>
              <div className="dark-card-body p-3">
                <MarkdownRenderer content={buildConsolidatedMarkdown()} />
              </div>
            </div>
          )}

          {/* Compilation Logs Card */}
          {compilationResult && (
            <div className="dark-card mt-4 mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <span className="fw-bold text-light small">1. Logs de Compilação</span>
                <span className={`badge ${compilationResult.success ? "bg-success" : "bg-danger"}`}>
                  {compilationResult.success ? "Compilado com Sucesso" : "Erro Sintático"}
                </span>
              </div>
              <div className="dark-card-body">
                <p className="mb-2 text-light small">{compilationResult.message}</p>
                {compilationResult.logs && (
                  <pre
                    className="p-3 rounded text-danger-emphasis font-monospace small mb-0"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", maxHeight: "200px", overflowY: "auto" }}
                  >
                    {compilationResult.logs}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Test Execution Outcomes */}
          {executionResult && (
            <div className="mt-4">
              <TestResultsTable
                outcomes={executionResult.outputs || []}
                rate={executionResult.rate}
                durationMs={executionResult.durationMs}
              />
            </div>
          )}

          {/* AI Quality Feedback */}
          {analysisResult && (
            <div className="dark-card mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span className="fw-bold text-light small">3. Diagnóstico e Boas Práticas (IA)</span>
                </div>
                {analysisResult.durationMs !== undefined && analysisResult.durationMs !== null && (
                  <span className="badge bg-secondary-subtle text-secondary small">
                    {analysisResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="dark-card-body">
                <MarkdownRenderer content={analysisResult.feedback || "Sem feedback disponível."} />
              </div>
            </div>
          )}

          {/* AI Optimization Feedback */}
          {optimizationResult && (
            <div className="dark-card mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <span className="fw-bold text-light small">4. Otimização Assintótica (IA)</span>
                </div>
                {optimizationResult.durationMs !== undefined && optimizationResult.durationMs !== null && (
                  <span className="badge bg-secondary-subtle text-secondary small">
                    {optimizationResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="dark-card-body">
                <MarkdownRenderer
                  content={optimizationResult.recommendations || "Sem recomendações disponíveis."}
                />
              </div>
            </div>
          )}

          {/* Placeholder if no process run yet */}
          {!isProcessing && !hasAnyResult && (
            <div className="dark-card text-center py-5 px-3 mt-4">
              <div className="text-secondary display-6 mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <h6 className="fw-bold text-white">Nenhum Processamento Realizado</h6>
              <p className="text-secondary small mb-0">
                Clique no botão <strong>Processar Código (Executar Tudo)</strong> para compilar, executar contra os gabaritos e receber o parecer da IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
