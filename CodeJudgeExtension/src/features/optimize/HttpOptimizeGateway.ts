import { IOptimizeGateway, OptimizeRequest, OptimizeResponse } from './IOptimizeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpOptimizeGateway extends BaseHttpGateway implements IOptimizeGateway {
  constructor(
    getApiUrl: () => string,
    getTimeoutMs: () => number,
    logger: ILogger
  ) {
    super(getApiUrl, logger, getTimeoutMs);
  }

  public async optimize(request: OptimizeRequest): Promise<OptimizeResponse> {
    const json = await this.postJson({
      endpoint: '/optimization/run',
      stageLabel: 'otimizacao',
      apiKey: request.apiKey,
      body: {
        statement: request.statement || '',
        language: request.language,
        code: request.code,
        apiKey: request.apiKey || undefined,
        engine: request.engine || undefined,
        model: request.model || undefined
      }
    });

    return {
      success: json?.success !== false,
      message: json?.message || 'Otimizacao concluida.',
      raw: json
    };
  }
}
