import { ILanguageGateway, ApiLanguageItem } from './ILanguageGateway';
import { ILogger } from '../../core/logger/ILogger';

export class HttpLanguageGateway implements ILanguageGateway {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly logger: ILogger
  ) {}

  public async fetchSupportedLanguages(): Promise<ApiLanguageItem[]> {
    const url = `${this.getApiUrl()}/languages`;
    this.logger.debug(`Consultando linguagens suportadas em ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao obter linguagens suportadas da API (HTTP ${response.status})`);
    }

    const data = await response.json() as any;
    return (data?.languages || []) as ApiLanguageItem[];
  }
}
