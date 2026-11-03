import { IPdfGenerator } from './IPdfGenerator';
import { normalizeMarkdownCodeFences } from '../../core/entities/Report';
import * as fs from 'fs';
import PDFDocument from 'pdfkit';

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}

function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/[\u2192\u279C]/g, '->')
    .replace(/[\u2190]/g, '<-')
    .replace(/[\u2705\u2713\u2714]/g, '[OK]')
    .replace(/[\u274C\u2715\u2716]/g, '[X]');
}

export class PdfKitReportGenerator implements IPdfGenerator {
  public async generate(
    targetPath: string,
    markdownContent: string,
    title = 'CodeJudge - Relatório Técnico'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let doc: PDFKit.PDFDocument | null = null;
      let writeStream: fs.WriteStream | null = null;

      try {
        doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: title,
            Author: 'Everton (CodeJudge)',
            Subject: 'Relatório Técnico de Execução e Avaliação',
            Creator: 'CodeJudge'
          }
        });

        writeStream = fs.createWriteStream(targetPath);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', err => {
          try {
            if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
          } catch {}
          reject(err);
        });

        doc.pipe(writeStream);

        const primaryColor = '#0f766e';
        const accentColor = '#10b981';
        const textDark = '#0f172a';
        const textMuted = '#475569';
        const bgCode = '#f8fafc';
        const borderLine = '#cbd5e1';
        const maxContentY = doc.page.height - 55;

        doc.rect(40, 40, 515, 52).fill(primaryColor);
        doc
          .fillColor('#ffffff')
          .fontSize(15)
          .font('Helvetica-Bold')
          .text('CODEJUDGE', 54, 48, { width: 490, lineBreak: false });
        doc
          .fillColor('#d1fae5')
          .fontSize(9.5)
          .font('Helvetica')
          .text('Relatório Técnico de Execução e Análise de Código', 54, 70, { width: 490, lineBreak: false });

        doc.y = 104;

        const normalized = normalizeMarkdownCodeFences(markdownContent);
        const sanitized = sanitizeForPdf(normalized);
        const rawLines = sanitized.split('\n');

        let studentMeta = '';
        let contactMeta = '';
        let fileMeta = '';
        let statusMeta = '';
        const filteredLines: string[] = [];

        for (const l of rawLines) {
          const trimmed = l.trim();
          if (
            trimmed === '# CodeJudge' ||
            trimmed === '## Relatório Técnico de Execução' ||
            trimmed === '*CodeJudge • Desenvolvido por Everton*' ||
            trimmed === 'CodeJudge - Desenvolvido por Everton' ||
            trimmed === '*CodeJudge - Desenvolvido por Everton*'
          ) {
            continue;
          }
          if (trimmed.startsWith('>') && trimmed.includes('Aluno(a):')) {
            studentMeta = cleanMarkdown(trimmed.replace(/^>\s*/, ''));
            continue;
          }
          if (trimmed.startsWith('>') && trimmed.includes('E-mail:') && (trimmed.includes('Moodle') || trimmed.includes('@'))) {
            contactMeta = cleanMarkdown(trimmed.replace(/^>\s*/, ''));
            continue;
          }
          if (trimmed.startsWith('>') && trimmed.includes('Arquivo:') && trimmed.includes('Linguagem:')) {
            fileMeta = cleanMarkdown(trimmed.replace(/^>\s*/, ''));
            continue;
          }
          if (trimmed.startsWith('>') && trimmed.includes('Status:')) {
            statusMeta = cleanMarkdown(trimmed.replace(/^>\s*/, ''));
            continue;
          }
          filteredLines.push(l);
        }

        while (
          filteredLines.length > 0 &&
          (filteredLines[filteredLines.length - 1].trim() === '' ||
            filteredLines[filteredLines.length - 1].trim() === '---')
        ) {
          filteredLines.pop();
        }

        const metaRows: Array<{ type: 'student' | 'contact' | 'file' | 'status'; text: string }> = [];
        if (studentMeta) metaRows.push({ type: 'student', text: studentMeta.replace(/\|/g, '  •  ') });
        if (contactMeta) metaRows.push({ type: 'contact', text: contactMeta.replace(/\|/g, '  •  ') });
        if (fileMeta) metaRows.push({ type: 'file', text: fileMeta.replace(/\|/g, '  •  ') });
        if (statusMeta) metaRows.push({ type: 'status', text: statusMeta });

        if (metaRows.length > 0) {
          const cardY = doc.y;
          let measuredCardHeight = 16;
          for (const row of metaRows) {
            doc.fontSize(8.5).font(row.type === 'student' ? 'Helvetica-Bold' : 'Helvetica');
            const h = doc.heightOfString(row.text, { width: 495, lineGap: 2 });
            measuredCardHeight += Math.max(h + 6, 17);
          }

          doc.rect(40, cardY, 515, measuredCardHeight).fill('#f8fafc');
          doc.rect(40, cardY, 515, measuredCardHeight).strokeColor(borderLine).lineWidth(1).stroke();
          doc.rect(40, cardY, 4, measuredCardHeight).fill(primaryColor);

          let rowY = cardY + 9;
          for (const row of metaRows) {
            if (row.type === 'student') {
              doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold');
              const h = doc.heightOfString(row.text, { width: 495, lineGap: 2 });
              doc.text(row.text, 54, rowY, { width: 495, lineGap: 2 });
              rowY += Math.max(h + 6, 17);
            } else if (row.type === 'contact') {
              doc.fillColor(textMuted).fontSize(8.5).font('Helvetica');
              const h = doc.heightOfString(row.text, { width: 495, lineGap: 2 });
              doc.text(row.text, 54, rowY, { width: 495, lineGap: 2 });
              rowY += Math.max(h + 6, 17);
            } else if (row.type === 'file') {
              doc.fillColor(textDark).fontSize(8.5).font('Helvetica');
              const h = doc.heightOfString(row.text, { width: 495, lineGap: 2 });
              doc.text(row.text, 54, rowY, { width: 495, lineGap: 2 });
              rowY += Math.max(h + 6, 17);
            } else if (row.type === 'status') {
              const isSuccess = row.text.includes('[Concluído com Sucesso]') || row.text.includes('[Aprovado]');
              const isError = row.text.includes('[Interrompido') || row.text.includes('[Falha]');
              const statusColor = isSuccess ? '#059669' : isError ? '#dc2626' : '#d97706';

              doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Bold').text('Status da Avaliação: ', 54, rowY, {
                continued: true,
                lineGap: 2
              });
              doc.fillColor(statusColor).font('Helvetica-Bold').text(row.text.replace(/Status:\s*/, ''), {
                width: 495,
                lineGap: 2
              });
              rowY += 17;
            }
          }

          doc.y = cardY + measuredCardHeight + 20;
        }

        let inCodeBlock = false;
        let codeBlockLines: string[] = [];

        const flushCodeBlock = () => {
          if (!doc || codeBlockLines.length === 0) return;
          doc.fontSize(8.5).font('Courier');

          let remaining = [...codeBlockLines];
          codeBlockLines = [];

          while (remaining.length > 0) {
            if (doc.y > maxContentY - 35) {
              doc.addPage();
            }

            const availableHeight = maxContentY - doc.y - 14;
            let chunk: string[] = [];
            let chunkHeight = 0;

            for (let idx = 0; idx < remaining.length; idx++) {
              const candidateLines = [...chunk, remaining[idx]];
              const candidateText = candidateLines.join('\n');
              const h = doc.heightOfString(candidateText, { width: 495, lineGap: 2.5 });
              if (h > availableHeight && chunk.length > 0) {
                break;
              }
              chunk.push(remaining[idx]);
              chunkHeight = h;
              if (h > availableHeight) {
                break;
              }
            }

            remaining = remaining.slice(chunk.length);
            const chunkText = chunk.join('\n');
            const boxHeight = Math.min(chunkHeight + 14, maxContentY - doc.y);
            const startY = doc.y;

            doc.rect(40, startY, 515, boxHeight).fill(bgCode);
            doc.rect(40, startY, 515, boxHeight).strokeColor(borderLine).stroke();

            const prevBottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 20;
            doc
              .fillColor('#0f172a')
              .font('Courier')
              .fontSize(8.5)
              .text(chunkText, 48, startY + 7, { width: 495, lineGap: 2.5 });
            doc.page.margins.bottom = prevBottom;

            doc.y = startY + boxHeight + 14;

            if (remaining.length > 0) {
              doc.addPage();
            }
          }
        };

        let inTable = false;
        let tableHeaderDone = false;
        const colWidths = [45, 110, 130, 130, 100];
        const colX = [40, 85, 195, 325, 455];

        for (let i = 0; i < filteredLines.length; i++) {
          const rawLine = filteredLines[i];
          const line = rawLine.trim();

          if (line.includes('command:codejudge.exportPdf') || line.includes('command:codejudge.exportPDF')) continue;

          if (line.startsWith('```')) {
            if (inCodeBlock) {
              inCodeBlock = false;
              flushCodeBlock();
            } else {
              inCodeBlock = true;
              codeBlockLines = [];
            }
            continue;
          }

          if (inCodeBlock) {
            codeBlockLines.push(rawLine);
            continue;
          }

          if (line.startsWith('|') && line.endsWith('|')) {
            if (line.includes('---')) continue;
            const cells = line
              .split('|')
              .map(c => cleanMarkdown(c))
              .filter(c => c !== '');

            if (cells.length >= 4) {
              if (doc.y > maxContentY - 25) doc.addPage();

              const rowH = 20;
              const startY = doc.y;
              const isHeader = !tableHeaderDone;

              if (isHeader) {
                doc.rect(40, startY, 515, rowH).fill('#f1f5f9');
                doc.rect(40, startY, 515, rowH).strokeColor('#cbd5e1').stroke();
                doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5);
                tableHeaderDone = true;
              } else {
                doc.rect(40, startY, 515, rowH).strokeColor('#e2e8f0').stroke();
                doc.font('Helvetica').fontSize(8.5);
              }

              for (let c = 0; c < Math.min(cells.length, colWidths.length); c++) {
                const val = cells[c];
                if (c === 4 && !isHeader) {
                  doc.fillColor(val.includes('[Aprovado]') ? '#059669' : '#dc2626').font('Helvetica-Bold');
                } else if (!isHeader) {
                  doc.fillColor('#334155').font('Helvetica');
                }
                doc.text(val, colX[c] + 4, startY + 5, { width: colWidths[c] - 8, lineBreak: false });
              }
              doc.y = startY + rowH;
              inTable = true;
              continue;
            }
          } else {
            if (inTable) {
              inTable = false;
              tableHeaderDone = false;
              doc.moveDown(0.7);
            }
          }

          if (line === '') {
            if (doc.y < maxContentY - 20) {
              doc.moveDown(0.4);
            }
            continue;
          }

          if (line.startsWith('# ')) {
            if (doc.y > maxContentY - 50) doc.addPage();
            doc.moveDown(0.9);
            doc
              .fillColor(primaryColor)
              .fontSize(13)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('# ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
            doc.moveDown(0.5);
          } else if (line.startsWith('## ')) {
            if (doc.y > maxContentY - 45) doc.addPage();
            doc.moveDown(0.8);
            doc
              .fillColor(textDark)
              .fontSize(11.5)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('## ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
            doc.moveDown(0.5);
          } else if (line.startsWith('### ')) {
            if (doc.y > maxContentY - 45) doc.addPage();
            doc.moveDown(0.8);
            doc
              .fillColor(primaryColor)
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('### ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
            doc.moveDown(0.5);
          } else if (line.startsWith('#### ')) {
            if (doc.y > maxContentY - 40) doc.addPage();
            doc.moveDown(0.7);
            doc
              .fillColor(textDark)
              .fontSize(10)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('#### ', '')), 40, doc.y, { width: 515, lineGap: 2 });
            doc.moveDown(0.4);
          } else if (line.startsWith('> ')) {
            const quoteText = cleanMarkdown(line.replace(/^>\s*/, ''));
            doc.fontSize(9.5).font('Helvetica-Oblique');
            const textH = doc.heightOfString(quoteText, { width: 495, lineGap: 4 });
            if (doc.y + textH + 18 > maxContentY) {
              doc.addPage();
            }
            const quoteY = doc.y;
            doc.rect(40, quoteY, 515, textH + 14).fill('#f8fafc');
            doc.rect(40, quoteY, 3, textH + 14).fill(accentColor);
            doc.fillColor('#334155').text(quoteText, 50, quoteY + 7, { width: 495, lineGap: 4 });
            doc.y = quoteY + textH + 20;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            if (doc.y > maxContentY - 25) doc.addPage();
            const clean = cleanMarkdown(line.substring(2));
            if (clean.startsWith('Resultado:')) {
              doc.fillColor(textDark).fontSize(9.5).font('Helvetica-Bold').text('  •  Resultado: ', 40, doc.y, {
                continued: true,
                lineGap: 4
              });
              doc.font('Helvetica').text(clean.replace('Resultado:', '').trim(), { width: 515, lineGap: 4 });
            } else {
              doc.fillColor(textDark).fontSize(9.5).font('Helvetica').text(`  •  ${clean}`, 40, doc.y, { width: 515, lineGap: 4 });
            }
            doc.moveDown(0.35);
          } else if (line.startsWith('---')) {
            if (doc.y < maxContentY - 25) {
              doc.moveDown(0.5);
              doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
              doc.moveDown(0.7);
            }
          } else {
            if (doc.y > maxContentY - 25) doc.addPage();
            const clean = cleanMarkdown(line);
            doc.fillColor(textDark).fontSize(9.5).font('Helvetica').text(clean, 40, doc.y, { width: 515, lineGap: 4.5 });
            doc.moveDown(0.6);
          }
        }

        if (inCodeBlock) {
          flushCodeBlock();
        }

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          const prevBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          doc
            .fillColor(textMuted)
            .fontSize(8)
            .font('Helvetica')
            .text(
              `CodeJudge • Desenvolvido por Everton • Página ${i - range.start + 1} de ${range.count}`,
              40,
              doc.page.height - 28,
              { align: 'center', width: 515, lineBreak: false }
            );
          doc.page.margins.bottom = prevBottomMargin;
        }

        doc.end();
      } catch (error) {
        try {
          if (doc) doc.end();
        } catch {}
        try {
          if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        } catch {}
        reject(error);
      }
    });
  }
}
