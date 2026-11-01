"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpPromptGateway = void 0;
class HttpPromptGateway {
    getApiUrl;
    logger;
    constructor(getApiUrl, logger) {
        this.getApiUrl = getApiUrl;
        this.logger = logger;
    }
    async loadAll() {
        const url = `${this.getApiUrl()}/prompts/all`;
        this.logger.debug(`Carregando catalogo de prompts em ${url}`);
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
        });
        if (!res.ok) {
            throw new Error(`Falha ao obter prompts da API (HTTP ${res.status})`);
        }
        return await res.json();
    }
    async loadSingle(category, promptKey) {
        const url = `${this.getApiUrl()}/prompts/single/${encodeURIComponent(category)}/${encodeURIComponent(promptKey)}`;
        this.logger.debug(`Carregando prompt individual em ${url}`);
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
        });
        if (!res.ok) {
            throw new Error(`Prompt '${category}/${promptKey}' nao localizado no servidor.`);
        }
        return await res.json();
    }
}
exports.HttpPromptGateway = HttpPromptGateway;
//# sourceMappingURL=HttpPromptGateway.js.map