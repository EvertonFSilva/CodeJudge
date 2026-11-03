"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpOptimizeGateway = void 0;
const BaseHttpGateway_1 = require("../../infrastructure/http/BaseHttpGateway");
class HttpOptimizeGateway extends BaseHttpGateway_1.BaseHttpGateway {
    constructor(getApiUrl, getTimeoutMs, logger) {
        super(getApiUrl, logger, getTimeoutMs);
    }
    async optimize(request) {
        const json = await this.postJson({
            endpoint: '/optimization/run',
            stageLabel: 'otimizacao',
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
            message: json?.message || 'Otimizacao concluida.',
            raw: json
        };
    }
}
exports.HttpOptimizeGateway = HttpOptimizeGateway;
//# sourceMappingURL=HttpOptimizeGateway.js.map