"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncLanguagesUseCase = void 0;
class SyncLanguagesUseCase {
    gateway;
    languageRegistry;
    logger;
    constructor(gateway, languageRegistry, logger) {
        this.gateway = gateway;
        this.languageRegistry = languageRegistry;
        this.logger = logger;
    }
    async execute() {
        try {
            const languages = await this.gateway.fetchSupportedLanguages();
            if (languages && languages.length > 0) {
                this.languageRegistry.updateFromApi(languages);
                const summary = languages.map(l => `${l.name} (${l.sourceExtension})`).join(', ');
                this.logger.info(`Linguagens suportadas sincronizadas dinamicamente com o servidor: ${summary}`);
            }
            return languages;
        }
        catch (err) {
            this.logger.warn(`Nao foi possivel sincronizar linguagens da API (${err?.message || err}). Usando definicoes locais.`);
            return [];
        }
    }
}
exports.SyncLanguagesUseCase = SyncLanguagesUseCase;
//# sourceMappingURL=SyncLanguagesUseCase.js.map