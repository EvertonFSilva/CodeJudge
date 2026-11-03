import { IAnalyzeGateway, AnalyzeRequest, AnalyzeResponse } from './IAnalyzeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpAnalyzeGateway extends BaseHttpGateway implements IAnalyzeGateway {
  constructor(
    getApiUrl: () => string,
    getTimeoutMs: () => number,
    logger: ILogger
  ) {
    super(getApiUrl, logger, getTimeoutMs);
  }

  public async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const json = await this.postJson({
      endpoint: '/analysis/run',
      stageLabel: 'analise',
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
      message: json?.message || 'Analise concluida.',
      raw: json
    };
  }
}
