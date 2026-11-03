import { ICompileGateway, CompileRequest, CompileResponse } from './ICompileGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpCompileGateway extends BaseHttpGateway implements ICompileGateway {
  constructor(
    getApiUrl: () => string,
    getTimeoutMs: () => number,
    logger: ILogger
  ) {
    super(getApiUrl, logger, getTimeoutMs);
  }

  public async compile(request: CompileRequest): Promise<CompileResponse> {
    const json = await this.postJson({
      endpoint: '/compilation/run',
      stageLabel: 'compilacao',
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
      message: json?.message || (json?.success !== false ? 'Codigo compilado com sucesso.' : 'Erro de compilacao.'),
      raw: json
    };
  }
}
