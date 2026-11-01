import { jsPDF } from "jspdf";
import { ExecutionResult, CompilationResult, AnalysisResult, OptimizationResult } from "../types/codejudge";
import { UserProfile } from "../types/auth";

export interface FullReportPayload {
  userProfile?: UserProfile | null;
  fileName?: string;
  language: string;
  statement?: string;
  code: string;
  compilation?: CompilationResult | null;
  execution?: ExecutionResult | null;
  analysis?: AnalysisResult | null;
  optimization?: OptimizationResult | null;
}

export class PdfExportService {
  static exportReport(payload: FullReportPayload): void {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > 275) {
        doc.addPage();
        y = 18;
      }
    };

    // Header Background banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 28, "F");

    // Title & Logo mark
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("CodeJudge", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129); // emerald accent
    doc.text("Relatório Técnico de Avaliação & Diagnóstico com IA", margin, 19);

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const dateStr = new Date().toLocaleString("pt-BR");
    doc.text(`Gerado em: ${dateStr} | Autor: Everton`, margin, 24);

    y = 36;

    // Student / Institutional Card
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Dados do Estudante e Ambiente Acadêmico", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const studentName = payload.userProfile?.name || "Estudante Identificado";
    const studentEmail = payload.userProfile?.email || "N/A";
    const campus = payload.userProfile?.campus || "Instituto Federal Fluminense (IFF)";

    doc.text(`Nome: ${studentName}`, margin, y);
    y += 4.5;
    doc.text(`E-mail: ${studentEmail} | Instituição: ${campus}`, margin, y);
    y += 4.5;

    const detectedLang = payload.language.toUpperCase();
    const fileName = payload.fileName || `codigo${payload.language === "python" ? ".py" : payload.language === "java" ? ".java" : ".c"}`;
    doc.text(`Arquivo: ${fileName} | Linguagem Detectada: ${detectedLang}`, margin, y);
    y += 7;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Problem Statement (if provided)
    if (payload.statement && payload.statement.trim()) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Enunciado da Questão / Requisitos", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const statementLines = doc.splitTextToSize(payload.statement.trim(), contentWidth);
      for (const line of statementLines) {
        checkPageBreak(4.5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    }

    // Compilation Result (if executed)
    if (payload.compilation) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Etapa de Compilação", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (payload.compilation.success) {
        doc.setTextColor(16, 185, 129);
        doc.text("[SUCESSO] Código compilado sem erros sintáticos.", margin, y);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text(`[FALHA] ${payload.compilation.message}`, margin, y);
      }
      y += 5;

      if (payload.compilation.logs && payload.compilation.logs.trim()) {
        checkPageBreak(15);
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const logLines = doc.splitTextToSize(payload.compilation.logs.trim(), contentWidth);
        for (const line of logLines) {
          checkPageBreak(4);
          doc.text(line, margin, y);
          y += 4;
        }
        y += 3;
      }
    }

    // Execution & Test Cases
    if (payload.execution) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Etapa de Execução e Testes", margin, y);
      y += 5;

      const rate = payload.execution.rate !== undefined && payload.execution.rate !== null
        ? `${payload.execution.rate}%`
        : "N/A";
      const duration = payload.execution.durationMs !== undefined && payload.execution.durationMs !== null
        ? `${payload.execution.durationMs.toFixed(1)} ms`
        : "N/A";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Taxa de Acerto: ${rate} | Tempo de Execução: ${duration} | Status: ${payload.execution.success ? "Aprovado" : "Falhou"}`, margin, y);
      y += 6;

      if (payload.execution.outputs && payload.execution.outputs.length > 0) {
        payload.execution.outputs.forEach((outcome, idx) => {
          checkPageBreak(18);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          if (outcome.passed) {
            doc.setTextColor(16, 185, 129);
            doc.text(`Caso #${idx + 1} - [PASSOU]`, margin, y);
          } else {
            doc.setTextColor(239, 68, 68);
            doc.text(`Caso #${idx + 1} - [FALHOU]`, margin, y);
          }
          y += 4;

          doc.setFont("courier", "normal");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const inp = outcome.input.replace(/\n/g, " ").trim() || "(vazia)";
          const exp = outcome.expected.replace(/\n/g, " ").trim() || "(vazia)";
          const act = outcome.actual.replace(/\n/g, " ").trim() || "(vazia)";

          doc.text(`Entrada: ${inp}`, margin + 3, y);
          y += 4;
          doc.text(`Esperado: ${exp}`, margin + 3, y);
          y += 4;
          doc.text(`Obtido:   ${act}`, margin + 3, y);
          y += 5;
        });
      }
    }

    // AI Quality Analysis
    if (payload.analysis && payload.analysis.feedback) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("3. Diagnóstico e Boas Práticas de Código (IA)", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const analysisLines = doc.splitTextToSize(payload.analysis.feedback, contentWidth);
      for (const line of analysisLines) {
        checkPageBreak(4.5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    }

    // AI Optimization
    if (payload.optimization && payload.optimization.recommendations) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("4. Análise de Complexidade Assintótica e Otimizações (IA)", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const optLines = doc.splitTextToSize(payload.optimization.recommendations, contentWidth);
      for (const line of optLines) {
        checkPageBreak(4.5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    }

    // Submitted Code
    if (payload.code && payload.code.trim()) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Código-Fonte Avaliado", margin, y);
      y += 5;

      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      const codeLines = doc.splitTextToSize(payload.code, contentWidth);
      for (const line of codeLines) {
        checkPageBreak(3.8);
        doc.text(line, margin, y);
        y += 3.8;
      }
      y += 6;
    }

    // Save
    doc.save(`CodeJudge_Relatorio_${Date.now()}.pdf`);
  }
}
