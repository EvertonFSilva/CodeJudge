"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteUseCase = void 0;
class ExecuteUseCase {
    gateway;
    logger;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    async execute(language, code, tests, statement) {
        const startTime = Date.now();
        this.logger.stageStart('execute', { language, testsCount: tests.length });
        try {
            const response = await this.gateway.execute({ language, code, tests, statement });
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('execute', durationMs, response.success, `Taxa: ${response.successRate}% (${response.testResults.length} testes)`);
            return {
                success: response.success,
                message: response.message,
                testResults: response.testResults,
                successRate: response.successRate,
                data: response.raw,
                durationMs
            };
        }
        catch (err) {
            const durationMs = Date.now() - startTime;
            this.logger.stageEnd('execute', durationMs, false, err?.message);
            throw err;
        }
    }
}
exports.ExecuteUseCase = ExecuteUseCase;
//# sourceMappingURL=ExecuteUseCase.js.map