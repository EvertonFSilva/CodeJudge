"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStageUseCase = void 0;
class BaseStageUseCase {
    stageName;
    logger;
    constructor(stageName, logger) {
        this.stageName = stageName;
        this.logger = logger;
    }
    async execute(language, code, statement, aiOptions) {
        const startTime = Date.now();
        this.logger.stageStart(this.stageName, { language, codeLength: code.length });
        try {
            const request = {
                language,
                code,
                statement,
                apiKey: aiOptions?.apiKey,
                engine: aiOptions?.engine,
                model: aiOptions?.model
            };
            const response = await this.invokeGateway(request);
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd(this.stageName, durationMs, response.success, response.message);
            return {
                success: response.success,
                message: response.message,
                data: response.raw,
                durationMs
            };
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd(this.stageName, durationMs, false, err?.message);
            throw err;
        }
    }
}
exports.BaseStageUseCase = BaseStageUseCase;
//# sourceMappingURL=BaseStageUseCase.js.map