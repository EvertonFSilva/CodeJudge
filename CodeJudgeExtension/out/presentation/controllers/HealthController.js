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
        const [online, aiModels] = await Promise.all([
            this.healthUseCase.execute(),
            this.healthUseCase.fetchAiModels()
        ]);
        return {
            online,
            apiUrl: this.getApiUrl(),
            aiModels
        };
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map