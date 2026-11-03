"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHttpGateway = void 0;
const EncodingUtils_1 = require("../../core/utils/EncodingUtils");
class BaseHttpGateway {
    getApiUrl;
    logger;
    getTimeoutMs;
    constructor(getApiUrl, logger, getTimeoutMs = () => 30000) {
        this.getApiUrl = getApiUrl;
        this.logger = logger;
        this.getTimeoutMs = getTimeoutMs;
    }
    buildHeaders(apiKey) {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
        if (apiKey && apiKey.trim()) {
            headers['X-Api-Key'] = apiKey.trim();
        }
        return headers;
    }
    async postJson(options) {
        const url = `${this.getApiUrl()}${options.endpoint}`;
        const timeoutMs = options.timeoutMs ?? this.getTimeoutMs();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Requisitando ${options.stageLabel} em ${url}`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: this.buildHeaders(options.apiKey),
                body: JSON.stringify(options.body),
                signal: controller.signal
            });
            if (!res.ok) {
                let errMessage = `HTTP ${res.status}`;
                try {
                    const errJson = await res.json();
                    if (errJson?.message) {
                        errMessage += `: ${errJson.message}`;
                    }
                }
                catch { }
                throw new Error(errMessage);
            }
            const rawJson = await res.json();
            return (0, EncodingUtils_1.fixEncoding)(rawJson);
        }
        catch (err) {
            if (err?.name === 'AbortError') {
                throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na ${options.stageLabel}.`);
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
    async getJson(options) {
        const url = `${this.getApiUrl()}${options.endpoint}`;
        const timeoutMs = options.timeoutMs ?? this.getTimeoutMs();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Consultando ${url}`);
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: this.buildHeaders(),
                signal: controller.signal
            });
            if (!res.ok) {
                throw new Error(`${options.errorMessage} (HTTP ${res.status})`);
            }
            const rawJson = await res.json();
            return (0, EncodingUtils_1.fixEncoding)(rawJson);
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.BaseHttpGateway = BaseHttpGateway;
//# sourceMappingURL=BaseHttpGateway.js.map