"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileUseCase = void 0;
class CompileUseCase {
    gateway;
    logger;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    async execute(language, code, statement, aiOptions) {
        const startTime = Date.now();
        this.logger.stageStart('compile', { language, codeLength: code.length });
        try {
            const response = await this.gateway.compile({
                language,
                code,
                statement,
                apiKey: aiOptions?.apiKey,
                engine: aiOptions?.engine,
                model: aiOptions?.model
            });
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('compile', durationMs, response.success, response.message);
            return {
                success: response.success,
                message: response.message,
                data: response.raw,
                durationMs
            };
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('compile', durationMs, false, err?.message);
            throw err;
        }
    }
}
exports.CompileUseCase = CompileUseCase;
//# sourceMappingURL=CompileUseCase.js.map