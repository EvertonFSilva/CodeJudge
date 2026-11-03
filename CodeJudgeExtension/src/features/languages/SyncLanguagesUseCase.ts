import { ILanguageGateway, ApiLanguageItem } from './ILanguageGateway';
import { LanguageRegistry } from '../../core/languages/LanguageRegistry';
import { ILogger } from '../../core/logger/ILogger';

export class SyncLanguagesUseCase {
  private lastSyncTimestamp = 0;
  private cachedLanguages: ApiLanguageItem[] = [];
  private inFlightPromise: Promise<ApiLanguageItem[]> | null = null;
  private static readonly CACHE_TTL_MS = 5000;

  constructor(
    private readonly gateway: ILanguageGateway,
    private readonly languageRegistry: LanguageRegistry,
    private readonly logger: ILogger
  ) {}

  public async execute(force = false): Promise<ApiLanguageItem[]> {
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
      } catch (err: any) {
        this.logger.warn(`Nao foi possivel sincronizar linguagens da API (${err?.message || err}). Usando definicoes locais.`);
        return this.cachedLanguages;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
  }
}
