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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    const drawHeader = () => {
      // Top Emerald accent bar
      doc.setFillColor(15, 118, 110); // emerald-primary
      doc.rect(0, 0, pageWidth, 4, "F");

      // Main header background
      doc.setFillColor(13, 17, 23); // dark graphite
      doc.rect(0, 4, pageWidth, 24, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("CodeJudge", margin, 15);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129); // emerald accent
      doc.text("Relatório Técnico de Diagnóstico e Otimização com IA", margin, 20);

      // Metadata
      doc.setFontSize(7.5);
      doc.setTextColor(139, 148, 158);
      const dateStr = new Date().toLocaleString("pt-BR");
      doc.text(`Gerado em: ${dateStr}  |  Desenvolvido por Everton  |  Moodle IFF`, margin, 25);
    };

    const drawSubHeader = () => {
      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, pageWidth, 3, "F");

      doc.setFillColor(22, 27, 34);
      doc.rect(0, 3, pageWidth, 12, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CodeJudge  •  Relatório Técnico", margin, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text("Moodle IFF", pageWidth - margin - 20, 11);
    };

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 16) {
        doc.addPage();
        drawSubHeader();
        y = 20;
      }
    };

    // Draw page 1 header
    drawHeader();
    y = 34;

    // Student & Academic Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Dados Acadêmicos & Ambiente Moodle IFF", margin + 4, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const studentName = payload.userProfile?.name || "Estudante Identificado";
    const studentEmail = payload.userProfile?.email || "E-mail não informado";
    const campus = payload.userProfile?.campus || "Instituto Federal Fluminense (IFF)";
    const detectedLang = payload.language.toUpperCase();
    const fileName =
      payload.fileName ||
      `codigo${payload.language === "python" ? ".py" : payload.language === "java" ? ".java" : ".c"}`;

    doc.text(`Estudante: ${studentName}   |   Instituição: ${campus}`, margin + 4, y + 11.5);
    doc.text(`E-mail: ${studentEmail}`, margin + 4, y + 16.5);
    doc.text(`Arquivo: ${fileName}   |   Linguagem: ${detectedLang}`, margin + 4, y + 21);

    y += 29;

    // Optional Statement Card
    if (payload.statement && payload.statement.trim()) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Enunciado da Questão (Requisitos)", margin, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      const statementLines = doc.splitTextToSize(payload.statement.trim(), contentWidth);
      for (const line of statementLines) {
        checkPageBreak(4.5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    }

    // 1. Compilação
    if (payload.compilation) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Compilação", margin, y);
      y += 4.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      if (payload.compilation.success) {
        doc.setTextColor(16, 185, 129);
        doc.text("[SUCESSO] Código compilado perfeitamente sem erros de sintaxe.", margin, y);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text(`[FALHA DE SINTAXE] ${payload.compilation.message}`, margin, y);
      }
      y += 5;

      if (payload.compilation.logs && payload.compilation.logs.trim()) {
        checkPageBreak(15);
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        const logLines = doc.splitTextToSize(payload.compilation.logs.trim(), contentWidth - 4);
        for (const line of logLines) {
          checkPageBreak(4);
          doc.text(line, margin + 2, y);
          y += 4;
        }
        y += 3;
      }
    }

    // 2. Execução
    if (payload.execution) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Execução", margin, y);
      y += 4.5;

      const rate =
        payload.execution.rate !== undefined && payload.execution.rate !== null
          ? `${payload.execution.rate}%`
          : "N/A";
      const duration =
        payload.execution.durationMs !== undefined && payload.execution.durationMs !== null
          ? `${payload.execution.durationMs.toFixed(1)} ms`
          : "N/A";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Taxa de Acerto: ${rate}   |   Tempo: ${duration}   |   Status: ${
          payload.execution.success ? "Concluído" : "Falhou"
        }`,
        margin,
        y
      );
      y += 5.5;

      if (payload.execution.outputs && payload.execution.outputs.length > 0) {
        payload.execution.outputs.forEach((outcome, idx) => {
          checkPageBreak(22);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, 19, 1.5, 1.5, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          if (outcome.passed) {
            doc.setTextColor(16, 185, 129);
            doc.text(`Caso #${idx + 1} - [PASSOU]`, margin + 3, y + 4.5);
          } else {
            doc.setTextColor(220, 38, 38);
            doc.text(`Caso #${idx + 1} - [FALHOU]`, margin + 3, y + 4.5);
          }

          doc.setFont("courier", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);

          const inp = outcome.input.replace(/\n/g, " ").trim() || "(vazia)";
          const exp = outcome.expected.replace(/\n/g, " ").trim() || "(vazia)";
          const act = outcome.actual.replace(/\n/g, " ").trim() || "(vazia)";

          doc.text(`Entrada:   ${inp.substring(0, 85)}`, margin + 3, y + 8.5);
          doc.text(`Esperado:  ${exp.substring(0, 85)}`, margin + 3, y + 12.5);
          doc.text(`Obtido:    ${act.substring(0, 85)}`, margin + 3, y + 16.5);

          y += 22;
        });
      } else if (payload.execution.rawOutput) {
        checkPageBreak(15);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("Saída do Processo:", margin, y);
        y += 4;

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const rawLines = doc.splitTextToSize(payload.execution.rawOutput.trim(), contentWidth - 4);
        for (const line of rawLines) {
          checkPageBreak(4);
          doc.text(line, margin + 2, y);
          y += 4;
        }
        y += 3;
      }
    }

    // Helper to format structured text without overlapping
    const renderCleanTextSection = (title: string, rawText: string) => {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, y);
      y += 5;

      const lines = rawText.split("\n");
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          y += 2.5;
          continue;
        }

        // Subheading
        if (trimmed.startsWith("#")) {
          const cleanHeading = trimmed.replace(/^#+\s*/, "");
          checkPageBreak(7);
          y += 1.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanHeading, margin, y);
          y += 4.5;
          continue;
        }

        // Bullet item
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const cleanBullet = trimmed.replace(/^[*\-]\s*/, "");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          const wrapped = doc.splitTextToSize(cleanBullet, contentWidth - 6);
          for (let i = 0; i < wrapped.length; i++) {
            checkPageBreak(4);
            if (i === 0) {
              doc.text("•", margin + 2, y);
            }
            doc.text(wrapped[i], margin + 6, y);
            y += 4;
          }
          continue;
        }

        // Normal paragraph
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const cleanPara = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
        const wrapped = doc.splitTextToSize(cleanPara, contentWidth);
        for (const wline of wrapped) {
          checkPageBreak(4);
          doc.text(wline, margin, y);
          y += 4;
        }
      }
      y += 4;
    };

    // 3. Análise do código
    if (payload.analysis && payload.analysis.feedback) {
      renderCleanTextSection("3. Análise do código", payload.analysis.feedback);
    }

    // 4. Otimização
    if (payload.optimization && payload.optimization.recommendations) {
      renderCleanTextSection("4. Otimização", payload.optimization.recommendations);
    }

    // Submitted Code Block
    if (payload.code && payload.code.trim()) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Código-Fonte Processado", margin, y);
      y += 5;

      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);

      const codeLines = payload.code.split("\n");
      codeLines.forEach((cline, idx) => {
        checkPageBreak(3.8);
        const lineNum = String(idx + 1).padStart(3, " ");
        const textToDraw = `${lineNum} | ${cline}`;
        const wrappedCode = doc.splitTextToSize(textToDraw, contentWidth - 4);
        for (const w of wrappedCode) {
          checkPageBreak(3.6);
          doc.text(w, margin + 2, y);
          y += 3.6;
        }
      });
      y += 5;
    }

    // Page Numbering Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `CodeJudge • Moodle IFF  —  Página ${p} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }

    // Save PDF
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    doc.save(`CodeJudge_Relatorio_${cleanFileName}_${Date.now()}.pdf`);
  }
}
