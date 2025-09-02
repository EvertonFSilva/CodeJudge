export class CodeView {
    constructor(formId, responseId) {
        this.form = document.getElementById(formId);
        this.responseBox = document.getElementById(responseId);
        this.exportBtn = document.getElementById("exportBtn");
    }

    bindSubmit(handler) {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (this.exportBtn) {
                this.exportBtn.style.display = "none";
            }

            this.responseBox.innerHTML = 'Processando...';
            await handler(this.gatherFormData());
        });
    }

    gatherFormData() {
        const action = document.getElementById('action').value;
        const language = document.getElementById('language').value;
        const code = document.getElementById('sourceCode').value.trim();
        const inputsFile = document.getElementById('inputTestFile')?.files[0] ?? null;
        const expectedOutputsFile = document.getElementById('expectedOutputFile')?.files[0] ?? null;

        return { action, language, code, inputsFile, expectedOutputsFile };
    }

    renderResult(result, formData) {
        this.responseBox.innerHTML = '';

        if (this.exportBtn) {
            this.exportBtn.style.display = "inline-block";
        }

        if (result.success === false) {
            this.responseBox.innerHTML = `<pre>${marked.parse(result.message)}</pre>`;
            return;
        }

        if (formData.action === 'execute') {
            if (formData.tests && formData.tests.length > 0 && result.outputs) {
                const allExpectedEmpty = formData.tests.every(t => !t.expected || t.expected.trim() === '');
                if (allExpectedEmpty) {
                    this.responseBox.innerHTML += `
                    <pre style="color: red;">
O usuário não colocou nenhum arquivo de saída esperada.
                    </pre>
                `;
                    result.outputs.forEach(r => {
                        this.responseBox.innerHTML += `<pre><strong>Saída Obtida:</strong> ${r.actual}</pre>`;
                    });
                } else {

                    const results = result.outputs.map(r => ({
                        expected: r.expected || '',
                        actual: r.actual || '',
                        passed: r.passed
                    }));

                    results.forEach(r => {
                        this.responseBox.innerHTML += `
                    <pre>
<strong>Saída Esperada:</strong> ${r.expected}
<strong>Saída Obtida:</strong> ${r.actual}
<strong>Resultado:</strong> <span style="color:${r.passed ? 'green' : 'red'};">${r.passed ? 'Passou' : 'Não Passou'}</span>
                    </pre>
                    `;
                    });

                    const successRate = results.length > 0
                        ? Math.round(results.filter(r => r.passed).length / results.length * 100)
                        : 0;

                    this.responseBox.innerHTML += `<strong>Taxa de Sucesso: ${successRate}%</strong>`;
                }
            }
            else if (result.outputs) {
                result.outputs.forEach(output => {
                    if (typeof output === 'string') {
                        this.responseBox.innerHTML += `<pre>${output}</pre>`;
                    } else {
                        this.responseBox.innerHTML += `<pre>${JSON.stringify(output, null, 2)}</pre>`;
                    }
                });
            }
            else {
                this.responseBox.innerHTML = `<pre>${marked.parse(result.message)}</pre>`;
            }
        } else {
            this.responseBox.innerHTML = `<pre>${marked.parse(result.message)}</pre>`;
        }

        this.lastResult = { result, formData };
    }
}
