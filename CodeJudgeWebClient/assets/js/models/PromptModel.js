export class PromptModel {
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    async fetchAllPrompts(token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${this.apiBaseUrl}/prompts/all`, { headers });

        if (!response.ok) throw new Error('Erro ao carregar prompts');
        const data = await response.json();
        return data.templates || {};
    }

    async fetchPromptsByCategory(category, token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${this.apiBaseUrl}/prompts/category/${category}`, { headers });

        if (!response.ok) throw new Error('Erro ao carregar prompts por categoria');
        const data = await response.json();
        return data.templates || [];
    }

    async fetchSinglePrompt(category, promptName, token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${this.apiBaseUrl}/prompts/single/${category}/${promptName}`, { headers });

        if (!response.ok) throw new Error('Prompt não encontrado');
        return await response.json();
    }
}
