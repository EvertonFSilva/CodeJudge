"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeUseCase = void 0;
class AnalyzeUseCase {
    gateway;
    logger;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    async execute(language, code, statement, aiOptions) {
        const startTime = Date.now();
        this.logger.stageStart('analyze', { language });
        try {
            const response = await this.gateway.analyze({
                language,
                code,
                statement,
                apiKey: aiOptions?.apiKey,
                engine: aiOptions?.engine,
                model: aiOptions?.model
            });
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('analyze', durationMs, response.success, response.message);
            return {
                success: response.success,
                message: response.message,
                data: response.raw,
                durationMs
            };
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('analyze', durationMs, false, err?.message);
            throw err;
        }
    }
}
exports.AnalyzeUseCase = AnalyzeUseCase;
//# sourceMappingURL=AnalyzeUseCase.js.map