"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadPromptsUseCase = void 0;
class LoadPromptsUseCase {
    gateway;
    logger;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    async execute() {
        try {
            this.logger.info('Carregando catalogo de prompts.');
            const res = await this.gateway.loadAll();
            return {
                templates: res?.templates || {}
            };
        }
        catch (err) {
            this.logger.error('Erro ao carregar catalogo de prompts', err);
            throw err;
        }
    }
}
exports.LoadPromptsUseCase = LoadPromptsUseCase;
//# sourceMappingURL=LoadPromptsUseCase.js.map