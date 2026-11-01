import { ILanguageGateway, ApiLanguageItem } from './ILanguageGateway';
import { LanguageRegistry } from '../../core/languages/LanguageRegistry';
import { ILogger } from '../../core/logger/ILogger';

export class SyncLanguagesUseCase {
  constructor(
    private readonly gateway: ILanguageGateway,
    private readonly languageRegistry: LanguageRegistry,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<ApiLanguageItem[]> {
    try {
      const languages = await this.gateway.fetchSupportedLanguages();
      if (languages && languages.length > 0) {
        this.languageRegistry.updateFromApi(languages);
        const summary = languages.map(l => `${l.name} (${l.sourceExtension})`).join(', ');
        this.logger.info(`Linguagens suportadas sincronizadas dinamicamente com o servidor: ${summary}`);
      }
      return languages;
    } catch (err: any) {
      this.logger.warn(`Nao foi possivel sincronizar linguagens da API (${err?.message || err}). Usando definicoes locais.`);
      return [];
    }
  }
}
