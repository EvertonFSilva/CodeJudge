"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncLanguagesUseCase = void 0;
class SyncLanguagesUseCase {
    gateway;
    languageRegistry;
    logger;
    lastSyncTimestamp = 0;
    cachedLanguages = [];
    inFlightPromise = null;
    static CACHE_TTL_MS = 5000;
    constructor(gateway, languageRegistry, logger) {
        this.gateway = gateway;
        this.languageRegistry = languageRegistry;
        this.logger = logger;
    }
    async execute(force = false) {
        const now = Date.now();
        if (!force && this.cachedLanguages.length > 0 && now - this.lastSyncTimestamp < SyncLanguagesUseCase.CACHE_TTL_MS) {
            return this.cachedLanguages;
        }
        if (!force && this.inFlightPromise) {
            return this.inFlightPromise;
        }
        this.inFlightPromise = (async () => {
            try {
                const languages = await this.gateway.fetchSupportedLanguages();
                if (languages && languages.length > 0) {
                    this.languageRegistry.updateFromApi(languages);
                    this.cachedLanguages = languages;
                    this.lastSyncTimestamp = Date.now();
                    const summary = languages.map(l => `${l.name} (${l.sourceExtension})`).join(', ');
                    this.logger.info(`Linguagens suportadas sincronizadas dinamicamente com o servidor: ${summary}`);
                }
                return languages;
            }
            catch (err) {
                this.logger.warn(`Nao foi possivel sincronizar linguagens da API (${err?.message || err}). Usando definicoes locais.`);
                return this.cachedLanguages;
            }
            finally {
                this.inFlightPromise = null;
            }
        })();
        return this.inFlightPromise;
    }
}
exports.SyncLanguagesUseCase = SyncLanguagesUseCase;
//# sourceMappingURL=SyncLanguagesUseCase.js.map