"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeUseCase = void 0;
const BaseStageUseCase_1 = require("../common/BaseStageUseCase");
class AnalyzeUseCase extends BaseStageUseCase_1.BaseStageUseCase {
    gateway;
    constructor(gateway, logger) {
        super('analyze', logger);
        this.gateway = gateway;
    }
    invokeGateway(request) {
        return this.gateway.analyze(request);
    }
}
exports.AnalyzeUseCase = AnalyzeUseCase;
//# sourceMappingURL=AnalyzeUseCase.js.map