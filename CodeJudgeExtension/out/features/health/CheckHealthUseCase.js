"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckHealthUseCase = void 0;
class CheckHealthUseCase {
    getApiUrl;
    logger;
    constructor(getApiUrl, logger) {
        this.getApiUrl = getApiUrl;
        this.logger = logger;
    }
    async execute() {
        const baseUrl = this.getApiUrl();
        const url = `${baseUrl}/health`;
        this.logger.debug(`Verificando conectividade do servidor em ${url}`);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url, { method: 'GET', signal: controller.signal }).catch(async () => {
                return await fetch(`${baseUrl}/ai/models`, { method: 'GET', signal: controller.signal }).catch(async () => {
                    return await fetch(`${baseUrl}/`, { method: 'GET', signal: controller.signal });
                });
            });
            clearTimeout(timer);
            const isOnline = res.status < 500;
            this.logger.debug(`Status do servidor: ${isOnline ? 'Online' : 'Offline'}`);
            return isOnline;
        }
        catch {
            this.logger.debug('Servidor inacessivel.');
            return false;
        }
    }
    async fetchAiModels() {
        const url = `${this.getApiUrl()}/ai/models`;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url, { method: 'GET', signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok)
                return undefined;
            const json = await res.json();
            if (!json || typeof json !== 'object')
                return undefined;
            return {
                isUserKeyRequired: Boolean(json.isUserKeyRequired),
                defaultEngine: String(json.defaultEngine || 'ollama'),
                defaultModel: String(json.defaultModel || 'llama3:latest'),
                models: Array.isArray(json.models) ? json.models : [],
                providers: json.providers && typeof json.providers === 'object' ? json.providers : {},
                engines: Array.isArray(json.engines) ? json.engines : []
            };
        }
        catch {
            return undefined;
        }
    }
}
exports.CheckHealthUseCase = CheckHealthUseCase;
//# sourceMappingURL=CheckHealthUseCase.js.map