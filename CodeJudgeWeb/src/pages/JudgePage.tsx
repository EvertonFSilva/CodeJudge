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
import { CustomDropdown, DropdownOption } from "../components/CustomDropdown";

interface JudgePageProps {
  user: UserProfile | null;
}

type OperationMode = "full" | "compile" | "execute" | "analyze" | "optimize";
type StepStatus = "pending" | "running" | "success" | "failed";

const MODE_OPTIONS: DropdownOption[] = [
  {
    value: "full",
    label: "Processamento Completo",
    description: "Compilar, executar, analisar e otimizar",
    group: "Recomendado",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    )
  },
  {
    value: "compile",
    label: "Apenas Compilar",
    description: "Verificar erros de sintaxe do código",
    group: "Opções Individuais",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 18l6-6-6-6"></path>
        <path d="M8 6l-6 6 6 6"></path>
      </svg>
    )
  },
  {
    value: "execute",
    label: "Apenas Executar",
    description: "Executar o código e validar saídas",
    group: "Opções Individuais",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    )
  },
  {
    value: "analyze",
    label: "Apenas Análise do código",
    description: "Revisão de qualidade e boas práticas",
    group: "Opções Individuais",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    )
  },
  {
    value: "optimize",
    label: "Apenas Otimização",
    description: "Análise de complexidade e desempenho",
    group: "Opções Individuais",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    )
  }
];

export const JudgePage: React.FC<JudgePageProps> = ({ user }) => {
  const [availableLanguages, setAvailableLanguages] = useState<LanguageItem[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>("Main.java");
  const [code, setCode] = useState<string>(
    'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Olá, CodeJudge!");\n    }\n}\n'
  );
  const [statement, setStatement] = useState<string>("");
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<OperationMode>("full");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Detected language (automatically determined, never forced upon the user)
  const [detectedLang, setDetectedLang] = useState<LanguageItem>({
    key: "java",
    name: "Java",
    sourceExtension: ".java",
    targetExtension: ".class",
    needsCompilation: true
  });

  // Optional Test cases accordion and files (initially empty and optional like the extension)
  const [isTestsOpen, setIsTestsOpen] = useState<boolean>(false);
  const [inputsFileText, setInputsFileText] = useState<string>("");
  const [outputsFileText, setOutputsFileText] = useState<string>("");
  const [inputsFileName, setInputsFileName] = useState<string | null>(null);
  const [outputsFileName, setOutputsFileName] = useState<string | null>(null);
  const [showInputPreview, setShowInputPreview] = useState<boolean>(false);
  const [showOutputPreview, setShowOutputPreview] = useState<boolean>(false);

  // Stepper state
  const [stepCompileStatus, setStepCompileStatus] = useState<StepStatus>("pending");
  const [stepExecuteStatus, setStepExecuteStatus] = useState<StepStatus>("pending");
  const [stepAnalyzeStatus, setStepAnalyzeStatus] = useState<StepStatus>("pending");
  const [stepOptimizeStatus, setStepOptimizeStatus] = useState<StepStatus>("pending");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processGlobalStatus, setProcessGlobalStatus] = useState<string>("Aguardando...");

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
        // Fallback default languages available
      }
    };
    fetchLanguages();
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const detected = LanguageDetectionService.detectFromCode(newCode, availableLanguages);
    setDetectedLang(detected);
    if (!activeFileName || activeFileName.startsWith("editor.") || activeFileName.toLowerCase().startsWith("main.")) {
      const baseName = detected.key === "java" ? "Main" : "main";
      setActiveFileName(`${baseName}${detected.sourceExtension}`);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      setOutputsFileText((event.target?.result as string) || "");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearInputsFile = () => {
    setInputsFileName(null);
    setInputsFileText("");
    setShowInputPreview(false);
  };

  const clearOutputsFile = () => {
    setOutputsFileName(null);
    setOutputsFileText("");
    setShowOutputPreview(false);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const parseTestCases = (): TestCase[] => {
    if (!inputsFileText.trim() && !outputsFileText.trim()) return [];

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
    setProcessGlobalStatus("Iniciando...");

    try {
      const tests = parseTestCases();

      // 1. COMPILAÇÃO
      if (mode === "full" || mode === "compile") {
        if (detectedLang.needsCompilation) {
          setStepCompileStatus("running");
          setProcessGlobalStatus("Compilação em andamento...");
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

      // 2. EXECUÇÃO
      if (mode === "full" || mode === "execute") {
        setStepExecuteStatus("running");
        setProcessGlobalStatus("Execução em andamento...");
        const execRes = await CodeJudgeService.execute(detectedLang.key, code, statement, tests);
        setExecutionResult(execRes);
        setStepExecuteStatus(execRes.success ? "success" : "failed");
      }

      // 3. ANÁLISE DO CÓDIGO
      if (mode === "full" || mode === "analyze") {
        setStepAnalyzeStatus("running");
        setProcessGlobalStatus("Análise do código em andamento...");
        const anaRes = await CodeJudgeService.analyze(detectedLang.key, code, statement);
        setAnalysisResult(anaRes);
        setStepAnalyzeStatus(anaRes.success ? "success" : "failed");
      }

      // 4. OTIMIZAÇÃO
      if (mode === "full" || mode === "optimize") {
        setStepOptimizeStatus("running");
        setProcessGlobalStatus("Otimização em andamento...");
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
      md += `Taxa de Acerto: **${executionResult.rate !== null && executionResult.rate !== undefined ? `${executionResult.rate}%` : "Executado"}**\n`;
      if (executionResult.rawOutput) {
        md += `\`\`\`text\n${executionResult.rawOutput}\n\`\`\`\n\n`;
      }
    }

    if (analysisResult?.feedback) {
      md += `## 3. Análise do código\n\n${analysisResult.feedback}\n\n`;
    }

    if (optimizationResult?.recommendations) {
      md += `## 4. Otimização\n\n${optimizationResult.recommendations}\n\n`;
    }

    return md;
  };

  const hasAnyResult = Boolean(compilationResult || executionResult || analysisResult || optimizationResult);

  const getModeActionName = (selectedMode: OperationMode): string => {
    switch (selectedMode) {
      case "full":
        return "Processar Código (Executar Tudo)";
      case "compile":
        return "Compilar";
      case "execute":
        return "Executar";
      case "analyze":
        return "Análise do código";
      case "optimize":
        return "Otimização";
      default:
        return "Processar Código";
    }
  };

  const getModeInstruction = (selectedMode: OperationMode): string => {
    switch (selectedMode) {
      case "full":
        return "para iniciar as etapas de compilação, execução e diagnósticos.";
      case "compile":
        return "para verificar a sintaxe e gerar os binários.";
      case "execute":
        return "para rodar o binário e validar os casos de teste.";
      case "analyze":
        return "para iniciar a avaliação qualitativa do código com IA.";
      case "optimize":
        return "para receber recomendações de desempenho e complexidade.";
      default:
        return "para iniciar o processamento.";
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4 fade-in">
      {/* Top Bar with Title */}
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 pb-3"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div>
          <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Processamento de Código
          </h4>
          <p className="text-secondary small mb-0">
            Compilação, execução, análise do código e otimização automatizada com IA.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          className="p-3 rounded small d-flex align-items-center gap-2 mb-4"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5"
          }}
          role="alert"
        >
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
          <div className="dark-card dropdown-host-card mb-4">
            <div className="dark-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "420px" }}>
                <span className="fw-semibold text-light small flex-shrink-0">Modo de Operação:</span>
                <div className="flex-grow-1">
                  <CustomDropdown
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={(val) => setMode(val as OperationMode)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  onChange={handleSourceFileUpload}
                  accept=".c,.cpp,.cc,.cxx,.h,.hpp,.java,.py,.txt"
                />
                <button
                  type="button"
                  className="btn-action-upload"
                  onClick={() => fileInputRef.current?.click()}
                  title="Carregar arquivo de código"
                >
                  <i className="bi bi-upload"></i>
                  <span>Carregar</span>
                </button>

                <button
                  type="button"
                  className={`btn-action-copy ${copiedCode ? "copied" : ""}`}
                  onClick={copyCodeToClipboard}
                  title="Copiar código"
                >
                  <i className={`bi ${copiedCode ? "bi-check-lg" : "bi-clipboard"}`}></i>
                  <span>{copiedCode ? "Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  className="btn-action-delete"
                  onClick={() => handleCodeChange("")}
                  title="Limpar código"
                >
                  <i className="bi bi-trash"></i>
                  <span>Limpar</span>
                </button>
              </div>
            </div>

            {/* Problem Statement Accordion (Optional) */}
            <div style={{ backgroundColor: "#0d1117", borderBottom: "1px solid var(--border-color)" }}>
              <button
                type="button"
                className="statement-accordion-header"
                onClick={() => setIsStatementOpen(!isStatementOpen)}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-journal-text text-success fs-6"></i>
                  <span>Enunciado da Questão</span>
                  <span className="text-secondary small fw-normal">(Opcional)</span>
                </div>
                <i className={`bi bi-chevron-${isStatementOpen ? "up" : "down"} text-secondary`}></i>
              </button>

              {isStatementOpen && (
                <div className="p-3 pt-2">
                  <textarea
                    className="form-control dark-textarea small"
                    rows={3}
                    placeholder="Cole aqui o enunciado ou requisitos da questão para contextualizar o relatório e a IA..."
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    disabled={isProcessing}
                    style={{ lineHeight: "1.5" }}
                  ></textarea>
                </div>
              )}
            </div>

            {/* Source Code Editor */}
            <div className="p-0">
              <textarea
                className="code-editor-area"
                rows={15}
                placeholder="// Digite ou cole seu código-fonte aqui... A linguagem é identificada automaticamente!"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isProcessing}
                spellCheck={false}
              ></textarea>
            </div>

            {/* Execute Button */}
            <div
              className="p-3 d-flex justify-content-between align-items-center"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <span className="text-secondary small font-monospace">
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
                    <span>{getModeActionName(mode)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Test Cases Accordion (inputs.txt and outputs.txt) */}
          {(mode === "full" || mode === "execute") && (
            <div className="optional-accordion">
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => setIsTestsOpen(!isTestsOpen)}
              >
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Entradas e Saídas</span>
                  <span className="text-secondary small fw-normal">(Opcional)</span>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`chevron-icon ${isTestsOpen ? "open" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isTestsOpen && (
                <div className="p-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="optional-note">
                    Os arquivos são opcionais. Forneça arquivos <code>.txt</code> se desejar simular entradas de terminal e comparar com o gabarito.
                  </div>

                  <div className="row g-3">
                    {/* Inputs */}
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="small text-secondary fw-semibold">Arquivo de Entrada (.txt)</span>
                      </div>

                      {inputsFileName ? (
                        <div className="file-badge-chip">
                          <span className="text-white font-monospace small">{inputsFileName}</span>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-success text-decoration-none"
                              onClick={() => setShowInputPreview(!showInputPreview)}
                            >
                              {showInputPreview ? "Ocultar" : "Ver conteúdo"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                              onClick={clearInputsFile}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="dropzone-box"
                          onClick={() => inputFileRef.current?.click()}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1 d-block mx-auto">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>Selecionar ou soltar arquivo de entrada</span>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={inputFileRef}
                        className="d-none"
                        onChange={handleInputsUpload}
                        accept=".txt"
                      />

                      {showInputPreview && (
                        <textarea
                          className="form-control dark-textarea font-monospace small mt-2"
                          rows={4}
                          value={inputsFileText}
                          onChange={(e) => setInputsFileText(e.target.value)}
                          placeholder="Entradas do programa (stdin)"
                        ></textarea>
                      )}
                    </div>

                    {/* Outputs */}
                    <div className="col-md-6">
                      <div className="mb-2">
                        <span className="small text-secondary fw-semibold">Gabarito de Saída (.txt)</span>
                      </div>

                      {outputsFileName ? (
                        <div className="file-badge-chip">
                          <span className="text-white font-monospace small">{outputsFileName}</span>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-success text-decoration-none"
                              onClick={() => setShowOutputPreview(!showOutputPreview)}
                            >
                              {showOutputPreview ? "Ocultar" : "Ver conteúdo"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                              onClick={clearOutputsFile}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="dropzone-box"
                          onClick={() => outputFileRef.current?.click()}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1 d-block mx-auto">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>Selecionar ou soltar gabarito esperado</span>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={outputFileRef}
                        className="d-none"
                        onChange={handleOutputsUpload}
                        accept=".txt"
                      />

                      {showOutputPreview && (
                        <textarea
                          className="form-control dark-textarea font-monospace small mt-2"
                          rows={4}
                          value={outputsFileText}
                          onChange={(e) => setOutputsFileText(e.target.value)}
                          placeholder="Saídas esperadas (stdout)"
                        ></textarea>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Stepper, Summary Banner, Results & Feedback */}
        <div className="col-lg-5">
          {/* Stepper Card */}
          <div className="stepper-card">
            <div className="stepper-header">
              <span>Progresso das Etapas</span>
              <span className="text-secondary font-monospace small">{processGlobalStatus}</span>
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
                  2. Execução
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
                  3. Análise do código
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
                  4. Otimização
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
                    O relatório foi gerado. Escolha como deseja visualizá-lo:
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
                  <span>Visualizar (.pdf)</span>
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
                  className="btn btn-sm btn-report-action py-0.5 px-2"
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

          {/* 1. Compilação Result */}
          {compilationResult && (
            <div className="dark-card mt-4 mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <span className="fw-bold text-light small">1. Compilação</span>
                <span className={`badge ${compilationResult.success ? "badge-custom-success" : "badge-custom-danger"}`}>
                  {compilationResult.success ? "Sucesso" : "Erro Sintático"}
                </span>
              </div>
              <div className="dark-card-body">
                <p className="mb-2 text-light small">{compilationResult.message}</p>
                {compilationResult.logs && (
                  <pre
                    className="p-3 rounded text-danger-emphasis font-monospace small mb-0"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-subtle)", maxHeight: "200px", overflowY: "auto" }}
                  >
                    {compilationResult.logs}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* 2. Execução Result */}
          {executionResult && (
            <div className="mt-4">
              {executionResult.outputs && executionResult.outputs.length > 0 ? (
                <TestResultsTable
                  outcomes={executionResult.outputs}
                  rate={executionResult.rate}
                  durationMs={executionResult.durationMs}
                />
              ) : (
                <div className="dark-card mb-4">
                  <div className="dark-card-header d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-light small">2. Execução</span>
                    <span className={`badge ${executionResult.success ? "badge-custom-success" : "badge-custom-danger"}`}>
                      {executionResult.success ? "Sucesso" : "Falha"}
                    </span>
                  </div>
                  <div className="dark-card-body">
                    <p className="mb-2 text-light small">{executionResult.message}</p>
                    {executionResult.rawOutput && (
                      <div>
                        <span className="text-secondary small d-block mb-1">Saída do Processo:</span>
                        <pre
                          className="p-3 rounded text-light font-monospace small mb-0"
                          style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-subtle)", maxHeight: "200px", overflowY: "auto" }}
                        >
                          {executionResult.rawOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Análise do código Result */}
          {analysisResult && (
            <div className="dark-card mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span className="fw-bold text-light small">3. Análise do código</span>
                </div>
                {analysisResult.durationMs !== undefined && analysisResult.durationMs !== null && (
                  <span className="badge badge-subtle-duration font-monospace">
                    {analysisResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="dark-card-body">
                <MarkdownRenderer content={analysisResult.feedback || "Sem análise disponível."} />
              </div>
            </div>
          )}

          {/* 4. Otimização Result */}
          {optimizationResult && (
            <div className="dark-card mb-4">
              <div className="dark-card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <span className="fw-bold text-light small">4. Otimização</span>
                </div>
                {optimizationResult.durationMs !== undefined && optimizationResult.durationMs !== null && (
                  <span className="badge badge-subtle-duration font-monospace">
                    {optimizationResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="dark-card-body">
                <MarkdownRenderer
                  content={optimizationResult.recommendations || "Sem recomendações de otimização disponíveis."}
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
              <h6 className="fw-bold text-white mb-1">Nenhum Processamento Realizado</h6>
              <p className="text-secondary small mb-0">
                Clique no botão <strong className="text-white">{getModeActionName(mode)}</strong> {getModeInstruction(mode)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
