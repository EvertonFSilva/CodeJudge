import { IPromptGateway } from './IPromptGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpPromptGateway extends BaseHttpGateway implements IPromptGateway {
  constructor(
    getApiUrl: () => string,
    logger: ILogger
  ) {
    super(getApiUrl, logger, () => 15000);
  }

  public async loadAll(): Promise<any> {
    return this.getJson({
      endpoint: '/prompts/all',
      errorMessage: 'Falha ao obter prompts da API'
    });
  }

  public async loadSingle(category: string, promptKey: string): Promise<any> {
    return this.getJson({
      endpoint: `/prompts/single/${encodeURIComponent(category)}/${encodeURIComponent(promptKey)}`,
      errorMessage: `Prompt '${category}/${promptKey}' nao localizado no servidor`
    });
  }
}
