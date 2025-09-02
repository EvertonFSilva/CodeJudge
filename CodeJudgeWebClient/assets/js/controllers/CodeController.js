import { CodeModel } from '../models/CodeModel.js';
import { CodeView } from '../views/CodeView.js';
import { readFileAsArray } from '../utils/FileUtils.js';
import { SessionManager } from '../utils/SessionManager.js';
import { ProfileController } from './ProfileController.js';

export class CodeController {
    constructor() {
        const logoutBtn = document.getElementById('logoutBtn');

        if (!SessionManager.isSessionValid()) {
            SessionManager.clearSession();
            window.location.href = 'login.html';
            return;
        }

        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                SessionManager.clearSession();
                window.location.href = 'login.html';
            });
        }

        this.model = new CodeModel();
        this.view = new CodeView('codeSubmissionForm', 'responseOutput');

        this.profileController = new ProfileController('profileElement', 'logoutBtn');

        this.view.bindSubmit(this.handleSubmit.bind(this));
        this.setupFileInputs();
    }

    async handleSubmit(formData) {
        if (formData.inputsFile) { //&& formData.expectedOutputsFile) {
            formData.tests = await this.parseFiles(formData.inputsFile, formData.expectedOutputsFile);
        }

        let result;
        switch (formData.action) {
            case 'execute': result = await this.model.executeCode(formData.language, formData.code, formData.tests); break;
            case 'compile': result = await this.model.compileCode(formData.language, formData.code); break;
            case 'analysis': result = await this.model.analyzeCode(formData.language, formData.code); break;
            case 'optimize': result = await this.model.optimizeCode(formData.language, formData.code); break;
        }

        this.view.renderResult(result, formData);
    }

    async parseFiles(inputFile, outputFile) {
        const inputs = inputFile ? await readFileAsArray(inputFile) : [];
        const outputs = outputFile ? await readFileAsArray(outputFile) : [];
        return inputs.map((input, i) => ({
            input,
            expected: outputs[i] || ''
        }));
    }

    // CASO QUISER OBRIGAR A TER ENTRADA E SAIDA.TXT
    //    async parseFiles(inputFile, outputFile) {
    //        const inputs = await readFileAsArray(inputFile);
    //        const outputs = await readFileAsArray(outputFile);
    //       return inputs.map((input, i) => ({ input, expected: outputs[i] || '' }));
    //    }

    setupFileInputs() {
        const files = [
            { file: 'inputTestFile', preview: 'inputPreview', removeBtn: 'removeInputFile', label: 'inputLabel' },
            { file: 'expectedOutputFile', preview: 'outputPreview', removeBtn: 'removeOutputFile', label: 'outputLabel' }
        ];

        files.forEach(({ file, preview, removeBtn, label }) => {
            const fileInput = document.getElementById(file);
            const filePreview = document.getElementById(preview);
            const removeButton = document.getElementById(removeBtn);
            const fileLabel = document.getElementById(label);

            fileInput.addEventListener('change', async () => {
                if (fileInput.files.length > 0) {
                    const text = await fileInput.files[0].text();
                    filePreview.textContent = text;
                    removeButton.style.display = 'inline-block';
                    fileLabel.textContent = `Arquivo carregado: ${fileInput.files[0].name}`;
                } else this.resetFile(fileInput, filePreview, removeButton, fileLabel);
            });

            removeButton.addEventListener('click', () => this.resetFile(fileInput, filePreview, removeButton, fileLabel));
        });
    }

    resetFile(input, preview, removeBtn, label) {
        input.value = '';
        preview.textContent = '';
        removeBtn.style.display = 'none';
        label.textContent = 'Nenhum arquivo carregado';
    }
}