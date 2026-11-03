"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpCompileGateway = void 0;
const EncodingUtils_1 = require("../../core/utils/EncodingUtils");
class HttpCompileGateway {
    getApiUrl;
    getTimeoutMs;
    logger;
    constructor(getApiUrl, getTimeoutMs, logger) {
        this.getApiUrl = getApiUrl;
        this.getTimeoutMs = getTimeoutMs;
        this.logger = logger;
    }
    async compile(request) {
        const url = `${this.getApiUrl()}/compilation/run`;
        const controller = new AbortController();
        const timeoutMs = this.getTimeoutMs();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Requisitando compilacao em ${url}`);
        try {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            };
            if (request.apiKey) {
                headers['X-Api-Key'] = request.apiKey;
            }
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    statement: request.statement || '',
                    language: request.language,
                    code: request.code,
                    apiKey: request.apiKey || undefined,
                    engine: request.engine || undefined,
                    model: request.model || undefined
                }),
                signal: controller.signal
            });
            if (!res.ok) {
                let errMessage = `HTTP ${res.status}`;
                try {
                    const json = await res.json();
                    if (json?.message)
                        errMessage += `: ${json.message}`;
                }
                catch { }
                throw new Error(errMessage);
            }
            const rawJson = await res.json();
            const json = (0, EncodingUtils_1.fixEncoding)(rawJson);
            return {
                success: json?.success !== false,
                message: json?.message || (json?.success !== false ? 'Codigo compilado com sucesso.' : 'Erro de compilacao.'),
                raw: json
            };
        }
        catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na compilacao.`);
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.HttpCompileGateway = HttpCompileGateway;
//# sourceMappingURL=HttpCompileGateway.js.map