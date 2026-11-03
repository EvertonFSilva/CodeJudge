"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAnalyzeGateway = void 0;
const BaseHttpGateway_1 = require("../../infrastructure/http/BaseHttpGateway");
class HttpAnalyzeGateway extends BaseHttpGateway_1.BaseHttpGateway {
    constructor(getApiUrl, getTimeoutMs, logger) {
        super(getApiUrl, logger, getTimeoutMs);
    }
    async analyze(request) {
        const json = await this.postJson({
            endpoint: '/analysis/run',
            stageLabel: 'analise',
            apiKey: request.apiKey,
            body: {
                statement: request.statement || '',
                language: request.language,
                code: request.code,
                apiKey: request.apiKey || undefined,
                engine: request.engine || undefined,
                model: request.model || undefined
            }
        });
        return {
            success: json?.success !== false,
            message: json?.message || 'Analise concluida.',
            raw: json
        };
    }
}
exports.HttpAnalyzeGateway = HttpAnalyzeGateway;
//# sourceMappingURL=HttpAnalyzeGateway.js.map