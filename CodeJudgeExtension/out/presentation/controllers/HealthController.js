"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
class HealthController {
    healthUseCase;
    getApiUrl;
    constructor(healthUseCase, getApiUrl) {
        this.healthUseCase = healthUseCase;
        this.getApiUrl = getApiUrl;
    }
    async check() {
        const online = await this.healthUseCase.execute();
        return {
            online,
            apiUrl: this.getApiUrl()
        };
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map