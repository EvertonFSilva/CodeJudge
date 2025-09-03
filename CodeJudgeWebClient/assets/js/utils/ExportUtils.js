export class ExportUtils {
    static getFormData() {
        return {
            teacher: document.getElementById("teacherName").value.trim(),
            course: document.getElementById("courseName").value.trim(),
            subject: document.getElementById("subjectName").value.trim(),
            year: document.getElementById("schoolYear").value.trim()
        };
    }

    static processHtmlContent(container) {
        if (!container) return [];

        const lines = [];

        const walkNode = (node, style = {}) => {
            const nodeName = node.nodeName.toUpperCase();
            const addLine = (text, opts = {}) => {
                if (text.trim() !== "") lines.push({ text, ...style, ...opts });
            };

            if (node.nodeType === Node.TEXT_NODE) {
                addLine(node.textContent);
            }
            else if (nodeName === "P") {
                addLine(node.textContent);
            }
            else if (nodeName === "PRE") {
                node.textContent.split("\n").forEach(line => addLine(line, { font: "courier" }));
            }
            else if (nodeName === "CODE") {
                addLine(node.textContent, { font: "courier" });
            }
            else if (nodeName === "STRONG") {
                addLine(node.textContent, { bold: true });
            }
            else if (nodeName === "EM") {
                addLine("_" + node.textContent + "_");
            }
            else if (nodeName === "BR") {
                addLine("");
            }
            else if (nodeName === "HR") {
                addLine("─────────────────────────────");
            }
            else if (nodeName === "BLOCKQUOTE") {
                addLine("> " + node.textContent.trim());
            }
            else if (nodeName === "OL" || nodeName === "UL") {
                node.querySelectorAll("li").forEach((li, idx) => {
                    const listPrefix = nodeName === "OL" ? `${idx + 1}. ` : "• ";
                    walkNode(li, style);
                    lines.push({ text: listPrefix + li.textContent, ...style });
                });
            }
            else if (nodeName.startsWith("H")) {
                const sizeMap = { H1: 18, H2: 16, H3: 14, H4: 12, H5: 12, H6: 12 };
                const fontSize = sizeMap[nodeName] || 12;
                addLine(node.textContent.toUpperCase(), { bold: true, fontSize });
            }
            else if (node.childNodes && node.childNodes.length > 0) {
                node.childNodes.forEach(child => walkNode(child, style));
            }
        };

        container.childNodes.forEach(node => walkNode(node));

        return lines;
    }

    static async generatePDF(profileName, responseElementId, code, action, language) {
        const { jsPDF } = window.jspdf;
        const { teacher, course, subject, year } = this.getFormData();
        const formattedDate = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

        const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        let y = 20;

        const addField = (label, value, ym = 0) => {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.text(`${label}:`, 20, y);
            pdf.setFont("helvetica", "normal");
            pdf.text(value, 65, y);
            y += 7 + ym;
        };

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("Relatório de Submissão de Código", 105, y, { align: "center" });
        y += 15;

        addField("Aluno", profileName);
        addField("Professor(a)", teacher);
        addField("Curso", course);
        addField("Disciplina", subject);
        addField("Ano Letivo", year);
        addField("Ação", action);
        addField("Linguagem", language);
        y += 5;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text('Código Enviado:', 20, y);
        y += 10

        // Código enviado
        pdf.setFont("courier", "normal");
        pdf.setFontSize(12);
        code.split("\n").forEach(line => {
            if (y > 280) { pdf.addPage(); y = 20; }
            pdf.text(line.replace(/ /g, "\u00A0"), 20, y);
            y += 6;
        });
        y += 5;

        // Processar HTML
        const responseContainer = document.getElementById(responseElementId);
        const lines = this.processHtmlContent(responseContainer);

        lines.forEach(line => {
            if (y > 280) { pdf.addPage(); y = 20; }
            if (line.font) pdf.setFont(line.font, line.bold ? "bold" : "normal");
            else pdf.setFont("helvetica", line.bold ? "bold" : "normal");
            pdf.setFontSize(line.fontSize || 12);
            pdf.text(line.text, 20, y);
            y += 7;
        });

        y += 5;
        pdf.setFont("helvetica", "bold");
        pdf.text(`Gerado em: ${formattedDate}`, 105, y, { align: "center" });

        pdf.save(`Relatorio de ${profileName}.pdf`);
    }
}