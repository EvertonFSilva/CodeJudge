"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLanguageGateway = void 0;
class HttpLanguageGateway {
    getApiUrl;
    logger;
    constructor(getApiUrl, logger) {
        this.getApiUrl = getApiUrl;
        this.logger = logger;
    }
    async fetchSupportedLanguages() {
        const url = `${this.getApiUrl()}/languages`;
        this.logger.debug(`Consultando linguagens suportadas em ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Falha ao obter linguagens suportadas da API (HTTP ${response.status})`);
        }
        const data = await response.json();
        return (data?.languages || []);
    }
}
exports.HttpLanguageGateway = HttpLanguageGateway;
//# sourceMappingURL=HttpLanguageGateway.js.map