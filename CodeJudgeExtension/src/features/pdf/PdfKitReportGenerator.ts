import { IPdfGenerator } from './IPdfGenerator';
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
    title = 'CodeJudge - Relatorio Tecnico'
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
            Subject: 'Relatorio Tecnico de Codigo',
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

        doc.rect(40, 40, 515, 48).fill(primaryColor);
        doc
          .fillColor('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('CODEJUDGE', 52, 49, { width: 490 });
        doc
          .fillColor('#d1fae5')
          .fontSize(9.5)
          .font('Helvetica')
          .text('Relatório Técnico de Execução e Análise de Código', 52, 68, { width: 490 });

        doc.y = 100;

        const sanitized = sanitizeForPdf(markdownContent);
        const rawLines = sanitized.split('\n');

        let fileMeta = '';
        let statusMeta = '';
        const filteredLines: string[] = [];

        for (const l of rawLines) {
          const trimmed = l.trim();
          if (trimmed === '# CodeJudge' || trimmed === '## Relatório Técnico de Execução') {
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

        if (fileMeta || statusMeta) {
          const cardY = doc.y;
          const cardHeight = statusMeta ? 46 : 30;
          doc.rect(40, cardY, 515, cardHeight).fill('#f8fafc');
          doc.rect(40, cardY, 515, cardHeight).strokeColor('#cbd5e1').lineWidth(1).stroke();
          doc.rect(40, cardY, 4, cardHeight).fill(primaryColor);

          if (fileMeta) {
            const formattedMeta = fileMeta.replace(/\|/g, '  •  ');
            doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(formattedMeta, 52, cardY + 9, { width: 495 });
          }
          if (statusMeta) {
            const isSuccess = statusMeta.includes('[Concluído com Sucesso]') || statusMeta.includes('[Aprovado]');
            const isError = statusMeta.includes('[Interrompido') || statusMeta.includes('[Falha]');
            const statusColor = isSuccess ? '#059669' : isError ? '#dc2626' : '#d97706';

            doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Bold').text('Status da Avaliação: ', 52, cardY + 26, { continued: true });
            doc.fillColor(statusColor).font('Helvetica-Bold').text(statusMeta.replace(/Status:\s*/, ''));
          }

          doc.y = cardY + cardHeight + 14;
        }

        let inCodeBlock = false;
        let codeBlockLines: string[] = [];

        const flushCodeBlock = () => {
          if (!doc || codeBlockLines.length === 0) return;
          const codeText = codeBlockLines.join('\n');
          doc.fontSize(8).font('Courier');
          const textHeight = doc.heightOfString(codeText, { width: 495 });
          const codeHeight = Math.min(textHeight + 14, 500);

          if (doc.y + codeHeight > doc.page.height - 60) {
            doc.addPage();
          }

          const startY = doc.y;
          doc.rect(40, startY, 515, codeHeight).fill(bgCode);
          doc.rect(40, startY, 515, codeHeight).strokeColor(borderLine).stroke();

          doc
            .fillColor('#0f172a')
            .font('Courier')
            .fontSize(8)
            .text(codeText, 48, startY + 7, { width: 495 });

          doc.y = startY + codeHeight + 8;
          codeBlockLines = [];
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
              if (doc.y > doc.page.height - 50) doc.addPage();

              const rowH = 18;
              const startY = doc.y;
              const isHeader = !tableHeaderDone;

              if (isHeader) {
                doc.rect(40, startY, 515, rowH).fill('#f1f5f9');
                doc.rect(40, startY, 515, rowH).strokeColor('#cbd5e1').stroke();
                doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
                tableHeaderDone = true;
              } else {
                doc.rect(40, startY, 515, rowH).strokeColor('#e2e8f0').stroke();
                doc.font('Helvetica').fontSize(8);
              }

              for (let c = 0; c < Math.min(cells.length, colWidths.length); c++) {
                const val = cells[c];
                if (c === 4 && !isHeader) {
                  doc.fillColor(val.includes('[Aprovado]') ? '#059669' : '#dc2626').font('Helvetica-Bold');
                } else if (!isHeader) {
                  doc.fillColor('#334155').font('Helvetica');
                }
                doc.text(val, colX[c] + 4, startY + 4, { width: colWidths[c] - 8, lineBreak: false });
              }
              doc.y = startY + rowH;
              inTable = true;
              continue;
            }
          } else {
            if (inTable) {
              inTable = false;
              tableHeaderDone = false;
              doc.moveDown(0.4);
            }
          }

          if (doc.y > doc.page.height - 65) {
            doc.addPage();
          }

          if (line.startsWith('# ')) {
            doc.moveDown(0.6);
            doc
              .fillColor(primaryColor)
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('# ', '')));
            doc.moveDown(0.2);
          } else if (line.startsWith('## ')) {
            doc.moveDown(0.4);
            doc
              .fillColor(textDark)
              .fontSize(10.5)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('## ', '')));
            doc.moveDown(0.2);
          } else if (line.startsWith('### ')) {
            doc.moveDown(0.3);
            doc
              .fillColor(primaryColor)
              .fontSize(9.5)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('### ', '')));
            doc.moveDown(0.2);
          } else if (line.startsWith('#### ')) {
            doc.moveDown(0.3);
            doc
              .fillColor(textDark)
              .fontSize(9)
              .font('Helvetica-Bold')
              .text(cleanMarkdown(line.replace('#### ', '')));
            doc.moveDown(0.1);
          } else if (line.startsWith('> ')) {
            const quoteText = cleanMarkdown(line.replace(/^>\s*/, ''));
            const quoteY = doc.y;
            doc.fontSize(8.5).font('Helvetica-Oblique');
            const textH = doc.heightOfString(quoteText, { width: 485 });

            doc.rect(40, quoteY, 3, textH + 4).fill(accentColor);
            doc.fillColor('#334155').text(quoteText, 48, quoteY + 2, { width: 485 });
            doc.y = quoteY + textH + 6;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const clean = cleanMarkdown(line.substring(2));
            if (clean.startsWith('Resultado:')) {
              doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text('  •  Resultado: ', { continued: true });
              doc.font('Helvetica').text(clean.replace('Resultado:', '').trim());
            } else {
              doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(`  •  ${clean}`);
            }
          } else if (line.startsWith('---')) {
            doc.moveDown(0.3);
            doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(borderLine).lineWidth(0.8).stroke();
            doc.moveDown(0.4);
          } else if (line !== '') {
            const clean = cleanMarkdown(line);
            doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(clean);
          } else {
            doc.moveDown(0.2);
          }
        }

        if (inCodeBlock) {
          flushCodeBlock();
        }

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fillColor(textMuted)
            .fontSize(8)
            .font('Helvetica')
            .text(
              `CodeJudge • Desenvolvido por Everton • Página ${i - range.start + 1} de ${range.count}`,
              40,
              doc.page.height - 30,
              { align: 'center', width: 515 }
            );
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
