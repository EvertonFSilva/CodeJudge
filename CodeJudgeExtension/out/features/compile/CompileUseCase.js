"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileUseCase = void 0;
const BaseStageUseCase_1 = require("../common/BaseStageUseCase");
class CompileUseCase extends BaseStageUseCase_1.BaseStageUseCase {
    gateway;
    constructor(gateway, logger) {
        super('compile', logger);
        this.gateway = gateway;
    }
    invokeGateway(request) {
        return this.gateway.compile(request);
    }
}
exports.CompileUseCase = CompileUseCase;
//# sourceMappingURL=CompileUseCase.js.map