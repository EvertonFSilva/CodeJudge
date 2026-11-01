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
import { PdfExportService } from "../services/PdfExportService";
import { TestResultsTable } from "../components/TestResultsTable";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

interface JudgePageProps {
  user: UserProfile | null;
}

type ActionType = "execution" | "compilation" | "analysis" | "optimization";

export const JudgePage: React.FC<JudgePageProps> = ({ user }) => {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("c");
  const [statement, setStatement] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("execution");

  // Test cases
  const [tests, setTests] = useState<TestCase[]>([
    { input: "10 20", expected: "30" },
    { input: "-5 15", expected: "10" }
  ]);
  const [rawInputsText, setRawInputsText] = useState<string>("10 20\n---\n-5 15");
  const [rawOutputsText, setRawOutputsText] = useState<string>("30\n---\n10");
  const [useRawInputs, setUseRawInputs] = useState<boolean>(false);

  // Results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const outputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const list = await CodeJudgeService.getLanguages();
        setLanguages(list);
        if (list.length > 0 && !list.some((l) => l.key === selectedLanguage)) {
          setSelectedLanguage(list[0].key);
        }
      } catch (err: unknown) {
        setErrorMessage("Não foi possível carregar as linguagens suportadas pela API.");
      }
    };
    loadLanguages();
  }, []);

  const handleLanguageChange = (langKey: string) => {
    setSelectedLanguage(langKey);
    if (!code.trim()) {
      if (langKey === "c") {
        setCode('#include <stdio.h>\n\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}\n');
      } else if (langKey === "java") {
        setCode('import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNextInt()) {\n            int a = scanner.nextInt();\n            int b = scanner.nextInt();\n            System.out.println(a + b);\n        }\n        scanner.close();\n    }\n}\n');
      } else if (langKey === "python") {
        setCode('import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        a, b = int(lines[0]), int(lines[1])\n        print(a + b)\n\nif __name__ == "__main__":\n    main()\n');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleInputsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawInputsText(content);
      parseRawTestCases(content, rawOutputsText);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleOutputsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawOutputsText(content);
      parseRawTestCases(rawInputsText, content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseRawTestCases = (inputsStr: string, outputsStr: string) => {
    const separator = inputsStr.includes("---") ? "---" : "\n";
    const outSeparator = outputsStr.includes("---") ? "---" : "\n";

    const inList = inputsStr.split(separator).map((s) => s.trim()).filter((s) => s.length > 0);
    const outList = outputsStr.split(outSeparator).map((s) => s.trim()).filter((s) => s.length > 0);

    const maxLen = Math.max(inList.length, outList.length);
    const parsed: TestCase[] = [];
    for (let i = 0; i < maxLen; i++) {
      parsed.push({
        input: inList[i] || "",
        expected: outList[i] || ""
      });
    }
    setTests(parsed);
  };

  const addTestCase = () => {
    setTests([...tests, { input: "", expected: "" }]);
  };

  const removeTestCase = (index: number) => {
    setTests(tests.filter((_, idx) => idx !== index));
  };

  const updateTestCase = (index: number, field: "input" | "expected", value: string) => {
    const updated = [...tests];
    updated[index][field] = value;
    setTests(updated);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      setErrorMessage("Por favor, informe o código-fonte antes de executar.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setExecutionResult(null);
    setCompilationResult(null);
    setAnalysisResult(null);
    setOptimizationResult(null);

    try {
      if (actionType === "compilation") {
        const result = await CodeJudgeService.compile(selectedLanguage, code, statement);
        setCompilationResult(result);
      } else if (actionType === "execution") {
        let activeTests = tests;
        if (useRawInputs) {
          parseRawTestCases(rawInputsText, rawOutputsText);
          activeTests = tests;
        }
        const result = await CodeJudgeService.execute(selectedLanguage, code, statement, activeTests);
        setExecutionResult(result);
      } else if (actionType === "analysis") {
        const result = await CodeJudgeService.analyze(selectedLanguage, code, statement);
        setAnalysisResult(result);
      } else if (actionType === "optimization") {
        const result = await CodeJudgeService.optimize(selectedLanguage, code, statement);
        setOptimizationResult(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar solicitação no CodeJudgeApp.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    PdfExportService.exportReport({
      userProfile: user,
      language: selectedLanguage,
      statement,
      code,
      execution: executionResult,
      analysis: analysisResult,
      optimization: optimizationResult
    });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-code-slash text-primary"></i>
            Juiz Online e Bancada de Aprendizado
          </h3>
          <p className="text-muted small mb-0">
            Execute seus programas contra cenários de teste, valide sintaxe e obtenha diagnósticos conceituais com IA.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {(executionResult || analysisResult || optimizationResult) && (
            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
              onClick={handleExportPdf}
            >
              <i className="bi bi-file-earmark-pdf-fill"></i>
              <span>Exportar Relatório PDF</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMessage}</div>
          <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Code and Problem input */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 fw-semibold small text-secondary">Linguagem:</label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isLoading}
                >
                  {languages.map((lang) => (
                    <option key={lang.key} value={lang.key}>
                      {lang.name} ({lang.sourceExtension})
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex align-items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  onChange={handleFileUpload}
                  accept=".c,.cpp,.java,.py,.js,.ts,.cs,.rb,.go,.rs,.txt"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  title="Importar arquivo de código"
                >
                  <i className="bi bi-upload"></i>
                  <span>Carregar Arquivo</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setCode("")}
                  title="Limpar código"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="p-3 bg-light border-bottom">
                <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center mb-1">
                  <span>Enunciado do Problema (Opcional, auxilia a análise da IA):</span>
                  <span className="text-muted fw-normal">Contexto da questão</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Ex: Leia dois números inteiros A e B e imprima a soma deles formatada com quebra de linha..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  disabled={isLoading}
                ></textarea>
              </div>

              <div className="position-relative">
                <textarea
                  className="form-control font-monospace border-0 p-3"
                  rows={16}
                  style={{ fontSize: "14px", lineHeight: "1.5", resize: "vertical", tabSize: 4 }}
                  placeholder="// Digite ou cole seu código-fonte aqui..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  spellCheck={false}
                ></textarea>
              </div>
            </div>

            <div className="card-footer bg-white border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="small fw-semibold text-secondary">Ação:</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${actionType === "execution" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActionType("execution")}
                  >
                    <i className="bi bi-play-fill me-1"></i> Executar Testes
                  </button>
                  <button
                    type="button"
                    className={`btn ${actionType === "compilation" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActionType("compilation")}
                  >
                    <i className="bi bi-gear-fill me-1"></i> Compilar
                  </button>
                  <button
                    type="button"
                    className={`btn ${actionType === "analysis" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActionType("analysis")}
                  >
                    <i className="bi bi-magic me-1"></i> Analisar Código (IA)
                  </button>
                  <button
                    type="button"
                    className={`btn ${actionType === "optimization" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActionType("optimization")}
                  >
                    <i className="bi bi-lightning-charge-fill me-1"></i> Otimizar (IA)
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-success px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                onClick={handleRun}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle-fill fs-6"></i>
                    <span>Executar Ação</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test cases panel (only for execution mode) */}
          {actionType === "execution" && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-card-checklist text-primary"></i>
                  <span className="fw-semibold text-dark">Casos de Teste</span>
                  <span className="badge bg-light text-dark border">
                    {useRawInputs ? "Modo Arquivos/Bloco" : `${tests.length} Caso(s)`}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setUseRawInputs(!useRawInputs)}
                  >
                    {useRawInputs ? "Modo Tabela de Testes" : "Modo Arquivos (.txt)"}
                  </button>

                  {!useRawInputs && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                      onClick={addTestCase}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Adicionar Teste</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body p-3">
                {useRawInputs ? (
                  <div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-semibold text-secondary mb-0">
                            Entradas (inputs.txt):
                          </label>
                          <input
                            type="file"
                            ref={inputFileRef}
                            className="d-none"
                            onChange={handleInputsFileUpload}
                            accept=".txt"
                          />
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={() => inputFileRef.current?.click()}
                          >
                            <i className="bi bi-upload me-1"></i> Carregar inputs.txt
                          </button>
                        </div>
                        <textarea
                          className="form-control font-monospace small"
                          rows={6}
                          value={rawInputsText}
                          onChange={(e) => {
                            setRawInputsText(e.target.value);
                            parseRawTestCases(e.target.value, rawOutputsText);
                          }}
                          placeholder="Digite as entradas separadas por '---' ou quebra de linha"
                        ></textarea>
                      </div>

                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-semibold text-secondary mb-0">
                            Saídas Esperadas (outputs.txt):
                          </label>
                          <input
                            type="file"
                            ref={outputFileRef}
                            className="d-none"
                            onChange={handleOutputsFileUpload}
                            accept=".txt"
                          />
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={() => outputFileRef.current?.click()}
                          >
                            <i className="bi bi-upload me-1"></i> Carregar outputs.txt
                          </button>
                        </div>
                        <textarea
                          className="form-control font-monospace small"
                          rows={6}
                          value={rawOutputsText}
                          onChange={(e) => {
                            setRawOutputsText(e.target.value);
                            parseRawTestCases(rawInputsText, e.target.value);
                          }}
                          placeholder="Digite as saídas esperadas correspondentes..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {tests.map((test, index) => (
                      <div key={index} className="p-3 bg-light rounded border d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-secondary">Caso de Teste #{index + 1}</span>
                          {tests.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm py-0 px-2"
                              onClick={() => removeTestCase(index)}
                              title="Remover caso de teste"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>

                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label small text-muted mb-1">Entrada (stdin):</label>
                            <textarea
                              className="form-control form-control-sm font-monospace"
                              rows={2}
                              value={test.input}
                              onChange={(e) => updateTestCase(index, "input", e.target.value)}
                              placeholder="Dados de entrada..."
                            ></textarea>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small text-muted mb-1">Saída Esperada (stdout):</label>
                            <textarea
                              className="form-control form-control-sm font-monospace"
                              rows={2}
                              value={test.expected}
                              onChange={(e) => updateTestCase(index, "expected", e.target.value)}
                              placeholder="Saída esperada..."
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Feedback and Results */}
        <div className="col-lg-5">
          {/* Compilation Results */}
          {compilationResult && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-dark">
                  <i className="bi bi-gear-wide-connected me-2 text-primary"></i>
                  Resultado da Compilação
                </h6>
                <span className={`badge ${compilationResult.success ? "bg-success" : "bg-danger"}`}>
                  {compilationResult.success ? "Compilado com Sucesso" : "Erro de Compilação"}
                </span>
              </div>
              <div className="card-body p-3">
                <p className="mb-2 fw-semibold text-secondary">{compilationResult.message}</p>
                {compilationResult.durationMs !== undefined && compilationResult.durationMs !== null && (
                  <p className="text-muted small mb-2">
                    <i className="bi bi-clock me-1"></i> Tempo: {compilationResult.durationMs.toFixed(1)} ms
                  </p>
                )}
                {compilationResult.logs && (
                  <div>
                    <label className="form-label small text-muted">Logs do Compilador:</label>
                    <pre className="p-3 bg-dark text-light rounded font-monospace small mb-0" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {compilationResult.logs}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Execution Outcomes */}
          {executionResult && (
            <div>
              <TestResultsTable
                outcomes={executionResult.outputs || []}
                rate={executionResult.rate}
                durationMs={executionResult.durationMs}
              />

              {executionResult.rawOutput && (
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3 border-bottom">
                    <h6 className="mb-0 fw-bold text-dark">
                      <i className="bi bi-terminal me-2 text-primary"></i>
                      Saída Bruta do Processo
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <pre className="p-3 bg-dark text-light rounded font-monospace small mb-0" style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {executionResult.rawOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Analysis Feedback */}
          {analysisResult && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-dark">
                  <i className="bi bi-robot me-2 text-primary"></i>
                  Diagnóstico e Feedback Conceitual com IA
                </h6>
                {analysisResult.durationMs !== undefined && analysisResult.durationMs !== null && (
                  <span className="badge bg-secondary">
                    {analysisResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="card-body p-3">
                <div className="alert alert-info py-2 px-3 small mb-3">
                  <i className="bi bi-info-circle-fill me-1"></i>
                  O feedback orienta sobre boas práticas, clareza e eventuais falhas conceituais sem entregar a resposta pronta.
                </div>
                <MarkdownRenderer content={analysisResult.feedback || "Sem feedback disponível."} />
              </div>
            </div>
          )}

          {/* AI Optimization Recommendations */}
          {optimizationResult && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-dark">
                  <i className="bi bi-speedometer2 me-2 text-primary"></i>
                  Recomendações de Otimização Assintótica
                </h6>
                {optimizationResult.durationMs !== undefined && optimizationResult.durationMs !== null && (
                  <span className="badge bg-secondary">
                    {optimizationResult.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>
              <div className="card-body p-3">
                <div className="alert alert-success py-2 px-3 small mb-3">
                  <i className="bi bi-lightbulb-fill me-1"></i>
                  Sugestões algorítmicas para redução de complexidade de tempo O(n) e espaço de memória.
                </div>
                <MarkdownRenderer content={optimizationResult.recommendations || "Sem recomendações disponíveis."} />
              </div>
            </div>
          )}

          {/* Placeholder when no results yet */}
          {!isLoading && !executionResult && !compilationResult && !analysisResult && !optimizationResult && (
            <div className="card shadow-sm border-0 text-center py-5 px-3">
              <div className="text-muted display-6 mb-3">
                <i className="bi bi-play-btn"></i>
              </div>
              <h6 className="fw-bold text-dark">Nenhuma Execução Realizada</h6>
              <p className="text-muted small mb-0">
                Selecione a ação desejada e clique em <strong>Executar Ação</strong> para visualizar o veredito dos testes ou a análise conceitual da IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
