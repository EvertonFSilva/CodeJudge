"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeUseCase = void 0;
const BaseStageUseCase_1 = require("../common/BaseStageUseCase");
class OptimizeUseCase extends BaseStageUseCase_1.BaseStageUseCase {
    gateway;
    constructor(gateway, logger) {
        super('optimize', logger);
        this.gateway = gateway;
    }
    invokeGateway(request) {
        return this.gateway.optimize(request);
    }
}
exports.OptimizeUseCase = OptimizeUseCase;
//# sourceMappingURL=OptimizeUseCase.js.map