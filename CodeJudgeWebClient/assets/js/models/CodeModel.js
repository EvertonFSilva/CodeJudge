export class CodeModel {
    constructor(apiUrl = 'http://localhost:8000') {
        this.apiUrl = apiUrl;
    }

    async executeCode(language, code, tests) {
        const response = await fetch(`${this.apiUrl}/execution/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code, tests })
        });

        return await response.json();
    }

    async compileCode(language, code) {
        const response = await fetch(`${this.apiUrl}/compilation/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code })
        });

        return await response.json();
    }

    async analyzeCode(language, code) {
        const response = await fetch(`${this.apiUrl}/analysis/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code })
        });

        return await response.json();
    }

    async optimizeCode(language, code) {
        const response = await fetch(`${this.apiUrl}/optimization/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code })
        });

        return await response.json();
    }
}