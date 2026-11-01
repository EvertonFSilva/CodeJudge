import { IPromptGateway } from './IPromptGateway';
import { LoadPromptsResult } from './PromptDTO';
import { ILogger } from '../../core/logger/ILogger';

export class LoadPromptsUseCase {
  constructor(
    private readonly gateway: IPromptGateway,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<LoadPromptsResult> {
    try {
      this.logger.info('Carregando catalogo de prompts.');
      const res = await this.gateway.loadAll();
      return {
        templates: res?.templates || {}
      };
    } catch (err: any) {
      this.logger.error('Erro ao carregar catalogo de prompts', err);
      throw err;
    }
  }
}
