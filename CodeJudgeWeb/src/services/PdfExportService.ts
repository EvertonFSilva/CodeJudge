import { jsPDF } from "jspdf";
import { ExecutionResult, AnalysisResult, OptimizationResult } from "../types/codejudge";
import { UserProfile } from "../types/auth";

export interface PdfExportPayload {
  userProfile?: UserProfile | null;
  language: string;
  statement?: string;
  code: string;
  execution?: ExecutionResult | null;
  analysis?: AnalysisResult | null;
  optimization?: OptimizationResult | null;
}

export class PdfExportService {
  static exportReport(payload: PdfExportPayload): void {
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
      if (y + neededHeight > 280) {
        doc.addPage();
        y = 18;
      }
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("CodeJudge - Relatório de Execução", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    const dateStr = new Date().toLocaleString("pt-BR");
    doc.text(`Gerado em: ${dateStr} | Autor: Everton`, margin, y);
    y += 6;

    if (payload.userProfile) {
      doc.text(`Estudante: ${payload.userProfile.name} (${payload.userProfile.email})`, margin, y);
      y += 6;
      if (payload.userProfile.campus) {
        doc.text(`Câmpus: ${payload.userProfile.campus}`, margin, y);
        y += 6;
      }
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text(`Linguagem: ${payload.language.toUpperCase()}`, margin, y);
    y += 6;

    if (payload.execution) {
      const rate = payload.execution.rate !== undefined && payload.execution.rate !== null
        ? `${payload.execution.rate}%`
        : "N/A";
      const duration = payload.execution.durationMs !== undefined && payload.execution.durationMs !== null
        ? `${payload.execution.durationMs.toFixed(2)} ms`
        : "N/A";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Status: ${payload.execution.success ? "Sucesso" : "Falha"} | Taxa de Acerto: ${rate} | Tempo: ${duration}`, margin, y);
      y += 8;
    }

    if (payload.statement && payload.statement.trim()) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Enunciado do Problema", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const statementLines = doc.splitTextToSize(payload.statement.trim(), contentWidth);
      for (const line of statementLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text("Código-Fonte Submetido", margin, y);
    y += 5;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    const codeLines = doc.splitTextToSize(payload.code, contentWidth);
    for (const line of codeLines) {
      checkPageBreak(4);
      doc.text(line, margin, y);
      y += 4;
    }
    y += 6;

    if (payload.execution && payload.execution.outputs && payload.execution.outputs.length > 0) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      doc.text("Resultados dos Cenários de Teste", margin, y);
      y += 6;

      payload.execution.outputs.forEach((outcome, idx) => {
        checkPageBreak(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        const passText = outcome.passed ? "[PASSOU]" : "[FALHOU]";
        doc.setTextColor(outcome.passed ? 40 : 200, outcome.passed ? 167 : 40, outcome.passed ? 69 : 40);
        doc.text(`Teste #${idx + 1} ${passText}`, margin, y);
        y += 4;

        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`Entrada: ${outcome.input.replace(/\n/g, " ") || "(vazia)"}`, margin + 4, y);
        y += 4;
        doc.text(`Esperado: ${outcome.expected.replace(/\n/g, " ") || "(vazio)"}`, margin + 4, y);
        y += 4;
        doc.text(`Obtido: ${outcome.actual.replace(/\n/g, " ") || "(vazio)"}`, margin + 4, y);
        y += 5;
      });
      y += 4;
    }

    if (payload.analysis && payload.analysis.feedback) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      doc.text("Diagnóstico e Feedback da Inteligência Artificial", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const feedbackLines = doc.splitTextToSize(payload.analysis.feedback, contentWidth);
      for (const line of feedbackLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    if (payload.optimization && payload.optimization.recommendations) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      doc.text("Recomendações de Otimização Assintótica", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const optLines = doc.splitTextToSize(payload.optimization.recommendations, contentWidth);
      for (const line of optLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    doc.save(`CodeJudge_Relatorio_${Date.now()}.pdf`);
  }
}
