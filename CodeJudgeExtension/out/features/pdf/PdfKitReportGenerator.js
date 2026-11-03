"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfKitReportGenerator = void 0;
const Report_1 = require("../../core/entities/Report");
const fs = __importStar(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
function cleanMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim();
}
function sanitizeForPdf(text) {
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
class PdfKitReportGenerator {
    async generate(targetPath, markdownContent, title = 'CodeJudge - Relatorio Tecnico') {
        return new Promise((resolve, reject) => {
            let doc = null;
            let writeStream = null;
            try {
                doc = new pdfkit_1.default({
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
                        if (fs.existsSync(targetPath))
                            fs.unlinkSync(targetPath);
                    }
                    catch { }
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
                doc.rect(40, 40, 515, 48).fill(primaryColor);
                doc
                    .fillColor('#ffffff')
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text('CODEJUDGE', 52, 49, { width: 490, lineBreak: false });
                doc
                    .fillColor('#d1fae5')
                    .fontSize(9.5)
                    .font('Helvetica')
                    .text('Relatório Técnico de Execução e Análise de Código', 52, 68, { width: 490, lineBreak: false });
                doc.y = 100;
                const normalized = (0, Report_1.normalizeMarkdownCodeFences)(markdownContent);
                const sanitized = sanitizeForPdf(normalized);
                const rawLines = sanitized.split('\n');
                let studentMeta = '';
                let contactMeta = '';
                let fileMeta = '';
                let statusMeta = '';
                const filteredLines = [];
                for (const l of rawLines) {
                    const trimmed = l.trim();
                    if (trimmed === '# CodeJudge' ||
                        trimmed === '## Relatório Técnico de Execução' ||
                        trimmed === '*CodeJudge • Desenvolvido por Everton*' ||
                        trimmed === 'CodeJudge - Desenvolvido por Everton' ||
                        trimmed === '*CodeJudge - Desenvolvido por Everton*') {
                        continue;
                    }
                    if (trimmed.startsWith('>') && trimmed.includes('Aluno(a):')) {
                        studentMeta = cleanMarkdown(trimmed.replace(/^>\s*/, ''));
                        continue;
                    }
                    if (trimmed.startsWith('>') && trimmed.includes('E-mail:') && trimmed.includes('Moodle')) {
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
                while (filteredLines.length > 0 &&
                    (filteredLines[filteredLines.length - 1].trim() === '' ||
                        filteredLines[filteredLines.length - 1].trim() === '---')) {
                    filteredLines.pop();
                }
                const metaRows = [];
                if (studentMeta)
                    metaRows.push({ type: 'student', text: studentMeta.replace(/\|/g, '  •  ') });
                if (contactMeta)
                    metaRows.push({ type: 'contact', text: contactMeta.replace(/\|/g, '  •  ') });
                if (fileMeta)
                    metaRows.push({ type: 'file', text: fileMeta.replace(/\|/g, '  •  ') });
                if (statusMeta)
                    metaRows.push({ type: 'status', text: statusMeta });
                if (metaRows.length > 0) {
                    const cardY = doc.y;
                    const cardHeight = metaRows.length * 15 + 14;
                    doc.rect(40, cardY, 515, cardHeight).fill('#f8fafc');
                    doc.rect(40, cardY, 515, cardHeight).strokeColor('#cbd5e1').lineWidth(1).stroke();
                    doc.rect(40, cardY, 4, cardHeight).fill(primaryColor);
                    let rowY = cardY + 8;
                    for (const row of metaRows) {
                        if (row.type === 'student') {
                            doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text(row.text, 52, rowY, {
                                width: 495,
                                lineBreak: false
                            });
                        }
                        else if (row.type === 'contact') {
                            doc.fillColor(textMuted).fontSize(8).font('Helvetica').text(row.text, 52, rowY, {
                                width: 495,
                                lineBreak: false
                            });
                        }
                        else if (row.type === 'file') {
                            doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(row.text, 52, rowY, {
                                width: 495,
                                lineBreak: false
                            });
                        }
                        else if (row.type === 'status') {
                            const isSuccess = row.text.includes('[Concluído com Sucesso]') || row.text.includes('[Aprovado]');
                            const isError = row.text.includes('[Interrompido') || row.text.includes('[Falha]');
                            const statusColor = isSuccess ? '#059669' : isError ? '#dc2626' : '#d97706';
                            doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Bold').text('Status da Avaliação: ', 52, rowY, {
                                continued: true
                            });
                            doc.fillColor(statusColor).font('Helvetica-Bold').text(row.text.replace(/Status:\s*/, ''), {
                                lineBreak: false
                            });
                        }
                        rowY += 15;
                    }
                    doc.y = cardY + cardHeight + 14;
                }
                let inCodeBlock = false;
                let codeBlockLines = [];
                const flushCodeBlock = () => {
                    if (!doc || codeBlockLines.length === 0)
                        return;
                    doc.fontSize(8).font('Courier');
                    let remaining = [...codeBlockLines];
                    codeBlockLines = [];
                    while (remaining.length > 0) {
                        if (doc.y > maxContentY - 30) {
                            doc.addPage();
                        }
                        const availableHeight = maxContentY - doc.y - 14;
                        let chunk = [];
                        let chunkHeight = 0;
                        for (let idx = 0; idx < remaining.length; idx++) {
                            const candidateLines = [...chunk, remaining[idx]];
                            const candidateText = candidateLines.join('\n');
                            const h = doc.heightOfString(candidateText, { width: 495 });
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
                            .fontSize(8)
                            .text(chunkText, 48, startY + 7, { width: 495 });
                        doc.page.margins.bottom = prevBottom;
                        doc.y = startY + boxHeight + 8;
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
                    if (line.includes('command:codejudge.exportPdf') || line.includes('command:codejudge.exportPDF'))
                        continue;
                    if (line.startsWith('```')) {
                        if (inCodeBlock) {
                            inCodeBlock = false;
                            flushCodeBlock();
                        }
                        else {
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
                        if (line.includes('---'))
                            continue;
                        const cells = line
                            .split('|')
                            .map(c => cleanMarkdown(c))
                            .filter(c => c !== '');
                        if (cells.length >= 4) {
                            if (doc.y > maxContentY - 20)
                                doc.addPage();
                            const rowH = 18;
                            const startY = doc.y;
                            const isHeader = !tableHeaderDone;
                            if (isHeader) {
                                doc.rect(40, startY, 515, rowH).fill('#f1f5f9');
                                doc.rect(40, startY, 515, rowH).strokeColor('#cbd5e1').stroke();
                                doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
                                tableHeaderDone = true;
                            }
                            else {
                                doc.rect(40, startY, 515, rowH).strokeColor('#e2e8f0').stroke();
                                doc.font('Helvetica').fontSize(8);
                            }
                            for (let c = 0; c < Math.min(cells.length, colWidths.length); c++) {
                                const val = cells[c];
                                if (c === 4 && !isHeader) {
                                    doc.fillColor(val.includes('[Aprovado]') ? '#059669' : '#dc2626').font('Helvetica-Bold');
                                }
                                else if (!isHeader) {
                                    doc.fillColor('#334155').font('Helvetica');
                                }
                                doc.text(val, colX[c] + 4, startY + 4, { width: colWidths[c] - 8, lineBreak: false });
                            }
                            doc.y = startY + rowH;
                            inTable = true;
                            continue;
                        }
                    }
                    else {
                        if (inTable) {
                            inTable = false;
                            tableHeaderDone = false;
                            doc.moveDown(0.4);
                        }
                    }
                    if (line === '') {
                        if (doc.y < maxContentY - 15) {
                            doc.moveDown(0.2);
                        }
                        continue;
                    }
                    if (doc.y > maxContentY - 15) {
                        doc.addPage();
                    }
                    if (line.startsWith('# ')) {
                        doc.moveDown(0.5);
                        doc
                            .fillColor(primaryColor)
                            .fontSize(12)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('# ', '')), 40, doc.y, { width: 515 });
                        doc.moveDown(0.2);
                    }
                    else if (line.startsWith('## ')) {
                        doc.moveDown(0.4);
                        doc
                            .fillColor(textDark)
                            .fontSize(10.5)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('## ', '')), 40, doc.y, { width: 515 });
                        doc.moveDown(0.2);
                    }
                    else if (line.startsWith('### ')) {
                        doc.moveDown(0.3);
                        doc
                            .fillColor(primaryColor)
                            .fontSize(9.5)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('### ', '')), 40, doc.y, { width: 515 });
                        doc.moveDown(0.2);
                    }
                    else if (line.startsWith('#### ')) {
                        doc.moveDown(0.3);
                        doc
                            .fillColor(textDark)
                            .fontSize(9)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('#### ', '')), 40, doc.y, { width: 515 });
                        doc.moveDown(0.1);
                    }
                    else if (line.startsWith('> ')) {
                        const quoteText = cleanMarkdown(line.replace(/^>\s*/, ''));
                        doc.fontSize(8.5).font('Helvetica-Oblique');
                        const textH = doc.heightOfString(quoteText, { width: 485 });
                        if (doc.y + textH + 8 > maxContentY) {
                            doc.addPage();
                        }
                        const quoteY = doc.y;
                        doc.rect(40, quoteY, 3, textH + 4).fill(accentColor);
                        doc.fillColor('#334155').text(quoteText, 48, quoteY + 2, { width: 485 });
                        doc.y = quoteY + textH + 6;
                    }
                    else if (line.startsWith('- ') || line.startsWith('* ')) {
                        const clean = cleanMarkdown(line.substring(2));
                        if (clean.startsWith('Resultado:')) {
                            doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text('  •  Resultado: ', 40, doc.y, { continued: true, width: 515 });
                            doc.font('Helvetica').text(clean.replace('Resultado:', '').trim());
                        }
                        else {
                            doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(`  •  ${clean}`, 40, doc.y, { width: 515 });
                        }
                    }
                    else if (line.startsWith('---')) {
                        if (doc.y < maxContentY - 20) {
                            doc.moveDown(0.3);
                            doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(borderLine).lineWidth(0.8).stroke();
                            doc.moveDown(0.4);
                        }
                    }
                    else {
                        const clean = cleanMarkdown(line);
                        doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(clean, 40, doc.y, { width: 515 });
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
                        .text(`CodeJudge • Desenvolvido por Everton • Página ${i - range.start + 1} de ${range.count}`, 40, doc.page.height - 28, { align: 'center', width: 515, lineBreak: false });
                    doc.page.margins.bottom = prevBottomMargin;
                }
                doc.end();
            }
            catch (error) {
                try {
                    if (doc)
                        doc.end();
                }
                catch { }
                try {
                    if (fs.existsSync(targetPath))
                        fs.unlinkSync(targetPath);
                }
                catch { }
                reject(error);
            }
        });
    }
}
exports.PdfKitReportGenerator = PdfKitReportGenerator;
//# sourceMappingURL=PdfKitReportGenerator.js.map