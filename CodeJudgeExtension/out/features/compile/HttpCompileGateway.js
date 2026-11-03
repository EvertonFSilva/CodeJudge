"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpCompileGateway = void 0;
const BaseHttpGateway_1 = require("../../infrastructure/http/BaseHttpGateway");
class HttpCompileGateway extends BaseHttpGateway_1.BaseHttpGateway {
    constructor(getApiUrl, getTimeoutMs, logger) {
        super(getApiUrl, logger, getTimeoutMs);
    }
    async compile(request) {
        const json = await this.postJson({
            endpoint: '/compilation/run',
            stageLabel: 'compilacao',
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
            message: json?.message || (json?.success !== false ? 'Codigo compilado com sucesso.' : 'Erro de compilacao.'),
            raw: json
        };
    }
}
exports.HttpCompileGateway = HttpCompileGateway;
//# sourceMappingURL=HttpCompileGateway.js.map