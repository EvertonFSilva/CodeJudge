"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAnalyzeGateway = void 0;
const EncodingUtils_1 = require("../../core/utils/EncodingUtils");
class HttpAnalyzeGateway {
    getApiUrl;
    getTimeoutMs;
    logger;
    constructor(getApiUrl, getTimeoutMs, logger) {
        this.getApiUrl = getApiUrl;
        this.getTimeoutMs = getTimeoutMs;
        this.logger = logger;
    }
    async analyze(request) {
        const url = `${this.getApiUrl()}/analysis/run`;
        const controller = new AbortController();
        const timeoutMs = this.getTimeoutMs();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Requisitando analise em ${url}`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    statement: request.statement || '',
                    language: request.language,
                    code: request.code
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
                message: json?.message || 'Analise concluida.',
                raw: json
            };
        }
        catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na analise.`);
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.HttpAnalyzeGateway = HttpAnalyzeGateway;
//# sourceMappingURL=HttpAnalyzeGateway.js.map