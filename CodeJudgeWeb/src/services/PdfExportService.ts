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

interface TextSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
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
      // Accent bar
      doc.setFillColor(15, 118, 110); // emerald-700
      doc.rect(0, 0, pageWidth, 4, "F");

      // Main banner
      doc.setFillColor(13, 17, 23); // dark slate/graphite
      doc.rect(0, 4, pageWidth, 24, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("CodeJudge", margin, 15);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text("Relatório Técnico de Execução, Diagnóstico e Otimização com IA", margin, 20);

      // Metadata
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
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
      doc.text("CodeJudge  •  Relatório Técnico Acadêmico", margin, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text("Instituto Federal Fluminense (IFF)", pageWidth - margin - 50, 11);
    };

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 16) {
        doc.addPage();
        drawSubHeader();
        y = 22;
      }
    };

    // Parse inline markdown tokens: **bold**, `code`, *italic*
    const parseInlineSpans = (text: string): TextSpan[] => {
      const spans: TextSpan[] = [];
      const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
      const parts = text.split(regex);

      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          spans.push({
            text: part.slice(2, -2),
            bold: true,
            italic: false,
            code: false
          });
        } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          spans.push({
            text: part.slice(1, -1),
            bold: false,
            italic: false,
            code: true
          });
        } else if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          spans.push({
            text: part.slice(1, -1),
            bold: false,
            italic: true,
            code: false
          });
        } else {
          spans.push({
            text: part,
            bold: false,
            italic: false,
            code: false
          });
        }
      }
      return spans;
    };

    // Render formatted text with word-wrapping and real bolding
    const renderRichLine = (
      rawText: string,
      startX: number,
      maxWidth: number,
      fontSize = 8,
      bullet = false
    ) => {
      const spans = parseInlineSpans(rawText);
      const lineHeight = fontSize * 0.52;

      let currentX = startX;
      if (bullet) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(15, 118, 110);
        doc.text("•", startX, y);
        currentX = startX + 4;
        maxWidth = maxWidth - 4;
      }

      for (const span of spans) {
        const fontType = span.code ? "courier" : "helvetica";
        const fontStyle = span.bold ? "bold" : span.italic ? "italic" : "normal";
        doc.setFont(fontType, fontStyle);
        doc.setFontSize(fontSize);

        if (span.bold) {
          doc.setTextColor(15, 23, 42); // slate-900 (strong dark)
        } else if (span.code) {
          doc.setTextColor(30, 41, 59); // slate-800
        } else {
          doc.setTextColor(51, 65, 85); // slate-700
        }

        const words = span.text.split(" ");
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const isLast = i === words.length - 1;
          const piece = isLast ? word : word + " ";
          const pieceWidth = doc.getTextWidth(piece);

          if (currentX + pieceWidth > startX + (bullet ? maxWidth + 4 : maxWidth)) {
            y += lineHeight;
            checkPageBreak(lineHeight + 2);
            currentX = bullet ? startX + 4 : startX;
          }

          doc.text(piece, currentX, y);
          currentX += pieceWidth;
        }
      }

      y += lineHeight;
    };

    // Render structured markdown sections with high visual hierarchy
    const renderStructuredMarkdown = (sectionTitle: string, rawMarkdown: string) => {
      checkPageBreak(25);

      // Section title header card
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "FD");

      // Left emerald indicator
      doc.setFillColor(15, 118, 110);
      doc.rect(margin, y, 3, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sectionTitle, margin + 6, y + 5.5);
      y += 13;

      const rawLines = rawMarkdown.split("\n");
      let inCodeBlock = false;
      const codeBlockLines: string[] = [];

      const flushCode = () => {
        if (codeBlockLines.length === 0) return;
        const codeText = codeBlockLines.join("\n");
        checkPageBreak(18);

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        const wrapped = doc.splitTextToSize(codeText, contentWidth - 8);
        const blockHeight = wrapped.length * 3.8 + 6;

        checkPageBreak(blockHeight);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 1.5, 1.5, "FD");

        let codeY = y + 4.5;
        doc.setTextColor(30, 41, 59);
        for (const w of wrapped) {
          doc.text(w, margin + 4, codeY);
          codeY += 3.8;
        }

        y += blockHeight + 4;
        codeBlockLines.length = 0;
      };

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trimEnd();
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
          if (inCodeBlock) {
            inCodeBlock = false;
            flushCode();
          } else {
            inCodeBlock = true;
          }
          continue;
        }

        if (inCodeBlock) {
          codeBlockLines.push(line);
          continue;
        }

        if (!trimmed) {
          y += 2.5;
          continue;
        }

        // H1 Title in markdown output (# Title) -> Prominent dimension heading
        if (trimmed.startsWith("# ")) {
          const titleText = trimmed.replace(/^#\s+/, "");
          checkPageBreak(14);
          y += 3;

          // Header underline/badge
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(15, 118, 110); // emerald accent
          doc.text(titleText, margin, y);
          y += 1.8;

          doc.setDrawColor(15, 118, 110);
          doc.setLineWidth(0.4);
          doc.line(margin, y, margin + doc.getTextWidth(titleText) + 8, y);
          y += 4.5;
          continue;
        }

        // H2 Title (## Subtitle)
        if (trimmed.startsWith("## ")) {
          const subTitle = trimmed.replace(/^##\s+/, "");
          checkPageBreak(10);
          y += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(subTitle, margin, y);
          y += 5;
          continue;
        }

        // H3 Title (### Sub-section)
        if (trimmed.startsWith("### ")) {
          const subTitle = trimmed.replace(/^###\s+/, "");
          checkPageBreak(8);
          y += 1.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(subTitle, margin, y);
          y += 4.5;
          continue;
        }

        // Table row (| col1 | col2 | col3 |)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          if (trimmed.includes("---")) continue; // skip markdown separator row
          const cells = trimmed
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c.length > 0);

          if (cells.length > 0) {
            checkPageBreak(7);
            const colWidth = contentWidth / cells.length;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(51, 65, 85);

            cells.forEach((cell, idx) => {
              const cleanCell = cell.replace(/\*\*(.*?)\*\*/g, "$1");
              const xPos = margin + idx * colWidth;
              doc.text(cleanCell.substring(0, 35), xPos + 1, y);
            });
            y += 4.5;
            continue;
          }
        }

        // Bullet point (- or *)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          checkPageBreak(6);
          const bulletContent = trimmed.replace(/^[-*]\s+/, "");
          renderRichLine(bulletContent, margin + 2, contentWidth - 4, 8, true);
          continue;
        }

        // Standard paragraph line with inline bold support
        checkPageBreak(5);
        renderRichLine(trimmed, margin, contentWidth, 8, false);
      }

      if (inCodeBlock) {
        flushCode();
      }

      y += 5;
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
    const studentEmail = payload.userProfile?.email || "E-mail institucional";
    const campus = payload.userProfile?.campus || "Instituto Federal Fluminense (IFF)";
    const detectedLang = payload.language.toUpperCase();
    const fileName =
      payload.fileName ||
      `codigo${payload.language === "python" ? ".py" : payload.language === "java" ? ".java" : ".c"}`;

    doc.text(`Estudante: ${studentName}   |   Instituição: ${campus}`, margin + 4, y + 11.5);
    doc.text(`E-mail: ${studentEmail}`, margin + 4, y + 16.5);
    doc.text(`Arquivo: ${fileName}   |   Linguagem: ${detectedLang}   |   Versão: v2.0.0`, margin + 4, y + 21);

    y += 29;

    // Optional Statement Card
    if (payload.statement && payload.statement.trim()) {
      checkPageBreak(25);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);

      const statementLines = doc.splitTextToSize(payload.statement.trim(), contentWidth - 8);
      const statementHeight = Math.min(statementLines.length * 4.2 + 10, 80);

      doc.roundedRect(margin, y, contentWidth, statementHeight, 1.5, 1.5, "FD");
      doc.setFillColor(15, 118, 110);
      doc.rect(margin, y, 3, statementHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Enunciado da Questão / Requisitos Avaliados", margin + 6, y + 5.5);

      let statY = y + 10.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      for (const line of statementLines.slice(0, 16)) {
        doc.text(line, margin + 6, statY);
        statY += 4;
      }

      y += statementHeight + 5;
    }

    // ==========================================
    // CÓDIGO-FONTE PROCESSADO (NO INÍCIO DO PDF)
    // ==========================================
    if (payload.code && payload.code.trim()) {
      checkPageBreak(30);

      const codeLines = payload.code.split("\n");
      const lineCount = codeLines.length;

      // Section Header Banner
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "FD");

      // Left blue-slate accent
      doc.setFillColor(51, 65, 85);
      doc.rect(margin, y, 3, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Código-Fonte Submetido (${detectedLang})  •  ${lineCount} linhas`, margin + 6, y + 5.5);
      y += 12;

      // Render Code Block with line numbers
      doc.setFont("courier", "normal");
      doc.setFontSize(7);

      for (let idx = 0; idx < codeLines.length; idx++) {
        checkPageBreak(4.2);

        const cline = codeLines[idx];
        const lineNum = String(idx + 1).padStart(3, " ");
        const textToDraw = `${lineNum} | ${cline}`;

        const wrappedCode = doc.splitTextToSize(textToDraw, contentWidth - 4);
        for (let wIdx = 0; wIdx < wrappedCode.length; wIdx++) {
          checkPageBreak(4);

          // Subtle alternating background for readability
          if (wIdx === 0 && idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 2.8, contentWidth, 3.8, "F");
          }

          doc.setFont("courier", "bold");
          doc.setTextColor(100, 116, 139); // line number in slate-500
          doc.text(lineNum, margin + 2, y);

          doc.setFont("courier", "normal");
          doc.setTextColor(15, 23, 42); // code in slate-900
          const codeContent = wIdx === 0 ? cline : "      " + wrappedCode[wIdx];
          doc.text(`| ${codeContent}`, margin + 9, y);

          y += 3.8;
        }
      }
      y += 6;
    }

    // ==========================================
    // 1. COMPILAÇÃO
    // ==========================================
    if (payload.compilation) {
      checkPageBreak(25);

      // Section Card
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "FD");

      const compSuccess = payload.compilation.success;
      doc.setFillColor(compSuccess ? 15 : 220, compSuccess ? 118 : 38, compSuccess ? 110 : 38);
      doc.rect(margin, y, 3, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Compilação", margin + 6, y + 5.5);

      // Status Chip inside title bar
      doc.setFontSize(8);
      if (compSuccess) {
        doc.setTextColor(16, 185, 129);
        doc.text("[SUCESSO: SINTAXE VÁLIDA]", pageWidth - margin - 52, y + 5.5);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text("[FALHA DE COMPILAÇÃO]", pageWidth - margin - 50, y + 5.5);
      }
      y += 12;

      // Status details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      if (compSuccess) {
        doc.setTextColor(16, 185, 129);
        doc.text("Código compilado perfeitamente sem erros de sintaxe ou violações estruturais.", margin + 2, y);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text(`Falha detectada: ${payload.compilation.message}`, margin + 2, y);
      }
      y += 5.5;

      if (payload.compilation.logs && payload.compilation.logs.trim()) {
        checkPageBreak(18);
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        const logLines = doc.splitTextToSize(payload.compilation.logs.trim(), contentWidth - 8);
        const logBoxH = logLines.length * 3.8 + 6;

        checkPageBreak(logBoxH);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, logBoxH, 1.5, 1.5, "FD");

        let logY = y + 4.5;
        for (const line of logLines) {
          doc.text(line, margin + 4, logY);
          logY += 3.8;
        }
        y += logBoxH + 4;
      }
      y += 3;
    }

    // ==========================================
    // 2. EXECUÇÃO
    // ==========================================
    if (payload.execution) {
      checkPageBreak(25);

      const hasRealTests =
        payload.execution.rate !== undefined &&
        payload.execution.rate !== null &&
        Array.isArray(payload.execution.outputs) &&
        payload.execution.outputs.length > 0 &&
        typeof payload.execution.outputs[0] === "object" &&
        payload.execution.outputs.some((o: any) => (o.input && o.input.trim()) || (o.expected && o.expected.trim()));

      // Section Card
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "FD");

      const execSuccess = payload.execution.success;
      doc.setFillColor(execSuccess ? 15 : 220, execSuccess ? 118 : 38, execSuccess ? 110 : 38);
      doc.rect(margin, y, 3, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Execução", margin + 6, y + 5.5);

      doc.setFontSize(8);
      if (execSuccess) {
        doc.setTextColor(16, 185, 129);
        doc.text("[CONCLUÍDO COM SUCESSO]", pageWidth - margin - 55, y + 5.5);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text("[FALHA NA EXECUÇÃO]", pageWidth - margin - 45, y + 5.5);
      }
      y += 12;

      // Summary Metrics Card
      const rate = hasRealTests ? `${payload.execution.rate}% de conformidade` : "Execução sem bateria de testes";
      const duration =
        payload.execution.durationMs !== undefined && payload.execution.durationMs !== null
          ? `${payload.execution.durationMs.toFixed(1)} ms`
          : "N/A";

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("Métricas:", margin + 4, y + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Taxa: ${rate}   |   Tempo de CPU: ${duration}`, margin + 22, y + 6.5);
      y += 15;

      if (hasRealTests && payload.execution.outputs && payload.execution.outputs.length > 0) {
        payload.execution.outputs.forEach((outcome, idx) => {
          checkPageBreak(26);

          const isPassed = outcome.passed;
          doc.setFillColor(isPassed ? 240 : 254, isPassed ? 253 : 242, isPassed ? 244 : 242);
          doc.setDrawColor(isPassed ? 167 : 254, isPassed ? 243 : 202, isPassed ? 208 : 202);
          doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, "FD");

          // Left indicator
          doc.setFillColor(isPassed ? 16 : 220, isPassed ? 185 : 38, isPassed ? 129 : 38);
          doc.rect(margin, y, 2.5, 23, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(isPassed ? 15 : 185, isPassed ? 118 : 28, isPassed ? 110 : 28);
          doc.text(`Caso de Teste #${idx + 1} — ${isPassed ? "[APROVADO]" : "[DIVERGENTE]"}`, margin + 5, y + 5);

          doc.setFont("courier", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);

          const inp = outcome.input.replace(/\n/g, " ").trim() || "(vazia)";
          const exp = outcome.expected.replace(/\n/g, " ").trim() || "(vazia)";
          const act = outcome.actual.replace(/\n/g, " ").trim() || "(vazia)";

          doc.text(`Entrada:   ${inp.substring(0, 85)}`, margin + 5, y + 10);
          doc.text(`Esperado:  ${exp.substring(0, 85)}`, margin + 5, y + 14.5);
          doc.text(`Obtido:    ${act.substring(0, 85)}`, margin + 5, y + 19);

          y += 26;
        });
      } else if (payload.execution.rawOutput) {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Saída do Processo (stdout):", margin, y);
        y += 5;

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        const rawLines = doc.splitTextToSize(payload.execution.rawOutput.trim(), contentWidth - 8);
        const rawHeight = rawLines.length * 3.8 + 6;

        checkPageBreak(rawHeight);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, rawHeight, 1.5, 1.5, "FD");

        let outY = y + 4.5;
        doc.setTextColor(30, 41, 59);
        for (const line of rawLines) {
          doc.text(line, margin + 4, outY);
          outY += 3.8;
        }
        y += rawHeight + 4;
      }
      y += 4;
    }

    // ==========================================
    // 3. ANÁLISE DO CÓDIGO
    // ==========================================
    if (payload.analysis && payload.analysis.feedback) {
      renderStructuredMarkdown("3. Análise do código", payload.analysis.feedback);
    }

    // ==========================================
    // 4. OTIMIZAÇÃO
    // ==========================================
    if (payload.optimization && payload.optimization.recommendations) {
      renderStructuredMarkdown("4. Otimização", payload.optimization.recommendations);
    }

    // ==========================================
    // NUMERAÇÃO DE PÁGINAS NO RODAPÉ
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Subtle bottom line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `CodeJudge  •  Instituto Federal Fluminense (IFF)  —  Página ${p} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: "center" }
      );
    }

    // Download PDF
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    doc.save(`CodeJudge_Relatorio_${cleanFileName}_${Date.now()}.pdf`);
  }
}
