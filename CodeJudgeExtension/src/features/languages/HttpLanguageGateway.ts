import { ILanguageGateway, ApiLanguageItem } from './ILanguageGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpLanguageGateway extends BaseHttpGateway implements ILanguageGateway {
  constructor(
    getApiUrl: () => string,
    logger: ILogger
  ) {
    super(getApiUrl, logger, () => 8000);
  }

  public async fetchSupportedLanguages(): Promise<ApiLanguageItem[]> {
    const data = await this.getJson({
      endpoint: '/languages',
      errorMessage: 'Falha ao obter linguagens suportadas da API'
    });
    return (data?.languages || []) as ApiLanguageItem[];
  }
}
