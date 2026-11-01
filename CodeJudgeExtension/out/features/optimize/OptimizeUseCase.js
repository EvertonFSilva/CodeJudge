"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeUseCase = void 0;
class OptimizeUseCase {
    gateway;
    logger;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    async execute(language, code, statement) {
        const startTime = Date.now();
        this.logger.stageStart('optimize', { language });
        try {
            const response = await this.gateway.optimize({ language, code, statement });
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('optimize', durationMs, response.success, response.message);
            return {
                success: response.success,
                message: response.message,
                data: response.raw,
                durationMs
            };
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('optimize', durationMs, false, err?.message);
            throw err;
        }
    }
}
exports.OptimizeUseCase = OptimizeUseCase;
//# sourceMappingURL=OptimizeUseCase.js.map