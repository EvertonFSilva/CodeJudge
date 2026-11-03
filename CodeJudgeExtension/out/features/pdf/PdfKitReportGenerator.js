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
const path = __importStar(require("path"));
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
function extractMetadata(rawLines) {
    const meta = {};
    const bodyLines = [];
    for (const l of rawLines) {
        const trimmed = l.trim();
        if (trimmed === '# CodeJudge' ||
            trimmed === '## Relatório Técnico de Execução' ||
            trimmed === '*CodeJudge • Desenvolvido por Everton*' ||
            trimmed === 'CodeJudge - Desenvolvido por Everton' ||
            trimmed === '*CodeJudge - Desenvolvido por Everton*') {
            continue;
        }
        if (trimmed.startsWith('>')) {
            const content = trimmed.replace(/^>\s*/, '');
            if (content.includes('Aluno(a):') || content.includes('Arquivo:') || content.includes('Status:')) {
                const parts = content.split('|').map(p => p.trim());
                for (const part of parts) {
                    const cleanPart = cleanMarkdown(part);
                    if (cleanPart.startsWith('Aluno(a):')) {
                        meta.studentName = cleanPart.replace('Aluno(a):', '').trim();
                    }
                    else if (cleanPart.startsWith('Curso:')) {
                        meta.course = cleanPart.replace('Curso:', '').trim();
                    }
                    else if (cleanPart.startsWith('Instituição:')) {
                        meta.institution = cleanPart.replace('Instituição:', '').trim();
                    }
                    else if (cleanPart.startsWith('E-mail:')) {
                        meta.email = cleanPart.replace('E-mail:', '').trim();
                    }
                    else if (cleanPart.startsWith('Usuário Moodle:')) {
                        meta.moodleUser = cleanPart.replace('Usuário Moodle:', '').trim();
                    }
                    else if (cleanPart.startsWith('Arquivo:')) {
                        meta.fileName = cleanPart.replace('Arquivo:', '').trim();
                    }
                    else if (cleanPart.startsWith('Linguagem:')) {
                        meta.language = cleanPart.replace('Linguagem:', '').trim();
                    }
                    else if (cleanPart.startsWith('Data:')) {
                        meta.date = cleanPart.replace('Data:', '').trim();
                    }
                    else if (cleanPart.startsWith('Status:')) {
                        meta.status = cleanPart.replace('Status:', '').trim();
                    }
                }
                continue;
            }
        }
        bodyLines.push(l);
    }
    while (bodyLines.length > 0 &&
        (bodyLines[bodyLines.length - 1].trim() === '' || bodyLines[bodyLines.length - 1].trim() === '---')) {
        bodyLines.pop();
    }
    return { meta, bodyLines };
}
function renderInlineSpans(doc, text, width, lineGap, defaultColor = '#334155') {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    if (parts.length === 1) {
        doc.font('Helvetica').fontSize(9.5).fillColor(defaultColor).text(cleanMarkdown(text), {
            width,
            lineGap
        });
        return;
    }
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part)
            continue;
        const isLast = i === parts.length - 1;
        const isBold = part.startsWith('**') && part.endsWith('**');
        const clean = cleanMarkdown(part);
        if (!clean)
            continue;
        if (isBold) {
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a').text(clean, {
                continued: !isLast,
                lineGap,
                width: !isLast ? undefined : width
            });
        }
        else {
            doc.font('Helvetica').fontSize(9.5).fillColor(defaultColor).text(clean, {
                continued: !isLast,
                lineGap,
                width: !isLast ? undefined : width
            });
        }
    }
}
function renderRichLine(doc, rawText, x, width, options) {
    const lineGap = options?.lineGap ?? 4.5;
    const isBullet = Boolean(options?.isBullet);
    const textDark = '#0f172a';
    const textBody = '#334155';
    const primaryColor = '#0f766e';
    const kvMatch = rawText.match(/^([*-]\s*)?\*\*?([A-Za-zÀ-ÖØ-öø-ÿ\s/()_-]+?)\*\*?\s*:\s*(.*)$/);
    if (kvMatch) {
        const bulletPrefix = kvMatch[1] || (isBullet ? '- ' : '');
        const label = kvMatch[2].trim();
        const value = kvMatch[3].trim();
        const isNota = label.toLowerCase() === 'nota' || label.toLowerCase().startsWith('nota');
        if (bulletPrefix) {
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text('  •  ', x, doc.y, { continued: true, lineGap });
        }
        const labelColor = isNota ? primaryColor : textDark;
        doc.font('Helvetica-Bold').fontSize(isNota ? 10 : 9.5).fillColor(labelColor).text(`${label}: `, {
            continued: Boolean(value),
            lineGap
        });
        if (value) {
            if (isNota) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#047857').text(cleanMarkdown(value), {
                    width,
                    lineGap
                });
            }
            else {
                renderInlineSpans(doc, value, width, lineGap, textBody);
            }
        }
        return;
    }
    let textToRender = rawText;
    if (textToRender.startsWith('- ') || textToRender.startsWith('* ')) {
        textToRender = textToRender.substring(2).trim();
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text('  •  ', x, doc.y, { continued: true, lineGap });
    }
    renderInlineSpans(doc, textToRender, width, lineGap, textBody);
}
class PdfKitReportGenerator {
    async generate(targetPath, markdownContent, title = 'CodeJudge - Relatório Técnico') {
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
                        Subject: 'Relatório Técnico de Execução e Avaliação',
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
                const candidateIconPaths = [
                    path.join(__dirname, '..', '..', '..', 'media', 'icon.png'),
                    path.join(__dirname, '..', '..', 'media', 'icon.png'),
                    path.join(process.cwd(), 'media', 'icon.png'),
                    path.join(process.cwd(), 'CodeJudgeExtension', 'media', 'icon.png')
                ];
                let iconPath = null;
                for (const p of candidateIconPaths) {
                    if (fs.existsSync(p)) {
                        iconPath = p;
                        break;
                    }
                }
                doc.rect(40, 40, 515, 62).fill(primaryColor);
                doc.rect(40, 40, 515, 3).fill(accentColor);
                doc.roundedRect(52, 48, 40, 40, 6).fill('#042f2e');
                if (iconPath) {
                    try {
                        doc.image(iconPath, 54, 50, { width: 36, height: 36 });
                    }
                    catch {
                        doc.lineWidth(2).strokeColor('#ffffff');
                        doc.moveTo(63, 62).lineTo(58, 68).lineTo(63, 74).stroke();
                        doc.moveTo(81, 62).lineTo(86, 68).lineTo(81, 74).stroke();
                        doc.strokeColor(accentColor);
                        doc.moveTo(74, 59).lineTo(70, 77).stroke();
                    }
                }
                else {
                    doc.lineWidth(2).strokeColor('#ffffff');
                    doc.moveTo(63, 62).lineTo(58, 68).lineTo(63, 74).stroke();
                    doc.moveTo(81, 62).lineTo(86, 68).lineTo(81, 74).stroke();
                    doc.strokeColor(accentColor);
                    doc.moveTo(74, 59).lineTo(70, 77).stroke();
                }
                doc
                    .fillColor('#ffffff')
                    .fontSize(16)
                    .font('Helvetica-Bold')
                    .text('CodeJudge', 102, 51, { lineBreak: false });
                doc.roundedRect(192, 53, 108, 14, 3).fill('#134e4a');
                doc
                    .fillColor('#34d399')
                    .fontSize(7.5)
                    .font('Helvetica-Bold')
                    .text('AVALIAÇÃO FORMATIVA', 198, 56.5, { lineBreak: false });
                doc
                    .fillColor('#ccfbf1')
                    .fontSize(8.5)
                    .font('Helvetica')
                    .text('Plataforma de Avaliação & Diagnóstico Técnico de Código', 102, 73, { lineBreak: false });
                doc
                    .fillColor('#ffffff')
                    .fontSize(8.5)
                    .font('Helvetica-Bold')
                    .text('Instituto Federal Fluminense', 350, 52, { width: 195, align: 'right', lineBreak: false });
                doc
                    .fillColor('#a7f3d0')
                    .fontSize(7.5)
                    .font('Helvetica')
                    .text('Ambiente Acadêmico Moodle IFF', 350, 66, { width: 195, align: 'right', lineBreak: false });
                doc
                    .fillColor('#5eead4')
                    .fontSize(7)
                    .font('Helvetica')
                    .text('Everton • CodeJudge v2.0', 350, 79, { width: 195, align: 'right', lineBreak: false });
                doc.y = 112;
                const normalized = (0, Report_1.normalizeMarkdownCodeFences)(markdownContent);
                const sanitized = sanitizeForPdf(normalized);
                const rawLines = sanitized.split('\n');
                const { meta, bodyLines } = extractMetadata(rawLines);
                const hasStudent = Boolean(meta.studentName && meta.studentName.trim());
                const cardY = doc.y;
                const cardHeight = hasStudent ? 78 : 50;
                doc.rect(40, cardY, 515, cardHeight).fill('#f8fafc');
                doc.rect(40, cardY, 515, cardHeight).strokeColor(borderLine).lineWidth(1).stroke();
                doc.rect(40, cardY, 4, cardHeight).fill(primaryColor);
                doc.moveTo(295, cardY + 7).lineTo(295, cardY + cardHeight - 7).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
                doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold');
                doc.text('IDENTIFICAÇÃO ACADÊMICA', 54, cardY + 8, { lineBreak: false });
                doc.text('DADOS DA SUBMISSÃO', 308, cardY + 8, { lineBreak: false });
                if (hasStudent) {
                    doc.fontSize(8.5);
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Aluno(a): ', 54, cardY + 22, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.studentName || '-', { width: 230, lineBreak: false });
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Curso / Disc.: ', 54, cardY + 36, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.course || '-', { width: 230, lineBreak: false });
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Instituição: ', 54, cardY + 50, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.institution || 'Instituto Federal Fluminense (IFF)', { width: 230, lineBreak: false });
                    doc.font('Helvetica-Bold').fillColor(textDark).text('E-mail: ', 54, cardY + 64, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.email || '-', { width: 230, lineBreak: false });
                }
                else {
                    doc.fontSize(8.5);
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Origem: ', 54, cardY + 22, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text('Ambiente Local / VS Code', { width: 230, lineBreak: false });
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Instituição: ', 54, cardY + 36, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text('Instituto Federal Fluminense (IFF)', { width: 230, lineBreak: false });
                }
                doc.fontSize(8.5);
                doc.font('Helvetica-Bold').fillColor(textDark).text('Arquivo: ', 308, cardY + 22, { continued: true, lineBreak: false });
                doc.font('Helvetica').fillColor('#334155').text(meta.fileName || '-', { width: 235, lineBreak: false });
                doc.font('Helvetica-Bold').fillColor(textDark).text('Linguagem: ', 308, cardY + 36, { continued: true, lineBreak: false });
                doc.font('Helvetica-Bold').fillColor(primaryColor).text(meta.language || '-', { width: 235, lineBreak: false });
                if (hasStudent) {
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Data: ', 308, cardY + 50, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.date || '-', { width: 235, lineBreak: false });
                    const isSuccess = (meta.status || '').includes('[Concluído com Sucesso]') || (meta.status || '').includes('[Aprovado]');
                    const isError = (meta.status || '').includes('[Interrompido') || (meta.status || '').includes('[Falha]');
                    const statusColor = isSuccess ? '#059669' : isError ? '#dc2626' : '#d97706';
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Status: ', 308, cardY + 64, { continued: true, lineBreak: false });
                    doc.font('Helvetica-Bold').fillColor(statusColor).text(meta.status || '-', { width: 235, lineBreak: false });
                }
                else {
                    doc.font('Helvetica-Bold').fillColor(textDark).text('Data: ', 308, cardY + 50, { continued: true, lineBreak: false });
                    doc.font('Helvetica').fillColor('#334155').text(meta.date || '-', { width: 235, lineBreak: false });
                }
                doc.y = cardY + cardHeight + 18;
                let inCodeBlock = false;
                let codeBlockLines = [];
                const flushCodeBlock = () => {
                    if (!doc || codeBlockLines.length === 0)
                        return;
                    doc.fontSize(8.5).font('Courier');
                    let remaining = [...codeBlockLines];
                    codeBlockLines = [];
                    while (remaining.length > 0) {
                        const currentY = doc.y;
                        const availableSpace = maxContentY - currentY;
                        if (availableSpace < 45) {
                            doc.addPage();
                            continue;
                        }
                        const maxLinesFit = Math.max(1, Math.floor((availableSpace - 14) / 12));
                        const chunk = remaining.slice(0, maxLinesFit);
                        remaining = remaining.slice(maxLinesFit);
                        const chunkH = chunk.length * 12 + 10;
                        doc.rect(40, currentY, 515, chunkH).fill(bgCode);
                        doc.rect(40, currentY, 515, chunkH).strokeColor(borderLine).lineWidth(0.8).stroke();
                        let lineY = currentY + 6;
                        for (let idx = 0; idx < chunk.length; idx++) {
                            doc
                                .fillColor('#0f172a')
                                .font('Courier')
                                .fontSize(8)
                                .text(chunk[idx], 48, lineY, { width: 495, lineBreak: false });
                            lineY += 12;
                        }
                        doc.y = currentY + chunkH + 12;
                    }
                };
                let inTable = false;
                let tableHeaderDone = false;
                const colWidths = [45, 110, 130, 130, 100];
                const colX = [40, 85, 195, 325, 455];
                for (let i = 0; i < bodyLines.length; i++) {
                    const rawLine = bodyLines[i];
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
                            if (doc.y > maxContentY - 25)
                                doc.addPage();
                            const rowH = 20;
                            const startY = doc.y;
                            const isHeader = !tableHeaderDone;
                            if (isHeader) {
                                doc.rect(40, startY, 515, rowH).fill('#f1f5f9');
                                doc.rect(40, startY, 515, rowH).strokeColor('#cbd5e1').stroke();
                                doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5);
                                tableHeaderDone = true;
                            }
                            else {
                                doc.rect(40, startY, 515, rowH).strokeColor('#e2e8f0').stroke();
                                doc.font('Helvetica').fontSize(8.5);
                            }
                            for (let c = 0; c < Math.min(cells.length, colWidths.length); c++) {
                                const val = cells[c];
                                if (c === 4 && !isHeader) {
                                    doc.fillColor(val.includes('[Aprovado]') ? '#059669' : '#dc2626').font('Helvetica-Bold');
                                }
                                else if (!isHeader) {
                                    doc.fillColor('#334155').font('Helvetica');
                                }
                                doc.text(val, colX[c] + 4, startY + 5, { width: colWidths[c] - 8, lineBreak: false });
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
                        if (doc.y > maxContentY - 50)
                            doc.addPage();
                        doc.moveDown(0.9);
                        doc
                            .fillColor(primaryColor)
                            .fontSize(13)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('# ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
                        doc.moveDown(0.5);
                    }
                    else if (line.startsWith('## ')) {
                        if (doc.y > maxContentY - 45)
                            doc.addPage();
                        doc.moveDown(0.8);
                        doc
                            .fillColor(textDark)
                            .fontSize(11.5)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('## ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
                        doc.moveDown(0.5);
                    }
                    else if (line.startsWith('### ')) {
                        if (doc.y > maxContentY - 45)
                            doc.addPage();
                        doc.moveDown(0.8);
                        doc
                            .fillColor(primaryColor)
                            .fontSize(10.5)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('### ', '')), 40, doc.y, { width: 515, lineGap: 2.5 });
                        doc.moveDown(0.5);
                    }
                    else if (line.startsWith('#### ')) {
                        if (doc.y > maxContentY - 40)
                            doc.addPage();
                        doc.moveDown(0.7);
                        doc
                            .fillColor(textDark)
                            .fontSize(9.5)
                            .font('Helvetica-Bold')
                            .text(cleanMarkdown(line.replace('#### ', '')), 40, doc.y, { width: 515, lineGap: 2 });
                        doc.moveDown(0.4);
                    }
                    else if (line.startsWith('> ')) {
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
                    }
                    else if (line.startsWith('---')) {
                        if (doc.y < maxContentY - 25) {
                            doc.moveDown(0.5);
                            doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
                            doc.moveDown(0.7);
                        }
                    }
                    else {
                        if (doc.y > maxContentY - 25)
                            doc.addPage();
                        renderRichLine(doc, line, 40, 515);
                        doc.moveDown(0.45);
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
                        .text(`CodeJudge • Instituto Federal Fluminense • Página ${i - range.start + 1} de ${range.count}`, 40, doc.page.height - 28, { align: 'center', width: 515, lineBreak: false });
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