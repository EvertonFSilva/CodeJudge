"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpOptimizeGateway = void 0;
const EncodingUtils_1 = require("../../core/utils/EncodingUtils");
class HttpOptimizeGateway {
    getApiUrl;
    getTimeoutMs;
    logger;
    constructor(getApiUrl, getTimeoutMs, logger) {
        this.getApiUrl = getApiUrl;
        this.getTimeoutMs = getTimeoutMs;
        this.logger = logger;
    }
    async optimize(request) {
        const url = `${this.getApiUrl()}/optimization/run`;
        const controller = new AbortController();
        const timeoutMs = this.getTimeoutMs();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Requisitando otimizacao em ${url}`);
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
                message: json?.message || 'Otimizacao concluida.',
                raw: json
            };
        }
        catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na otimizacao.`);
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.HttpOptimizeGateway = HttpOptimizeGateway;
//# sourceMappingURL=HttpOptimizeGateway.js.map