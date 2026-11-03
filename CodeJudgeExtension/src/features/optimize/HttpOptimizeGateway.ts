import { IOptimizeGateway, OptimizeRequest, OptimizeResponse } from './IOptimizeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { fixEncoding } from '../../core/utils/EncodingUtils';

export class HttpOptimizeGateway implements IOptimizeGateway {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly getTimeoutMs: () => number,
    private readonly logger: ILogger
  ) {}

  public async optimize(request: OptimizeRequest): Promise<OptimizeResponse> {
    const url = `${this.getApiUrl()}/optimization/run`;
    const controller = new AbortController();
    const timeoutMs = this.getTimeoutMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.debug(`Requisitando otimizacao em ${url}`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };
      if (request.apiKey) {
        headers['X-Api-Key'] = request.apiKey;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          statement: request.statement || '',
          language: request.language,
          code: request.code,
          apiKey: request.apiKey || undefined,
          engine: request.engine || undefined,
          model: request.model || undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          if (json?.message) errMessage += `: ${json.message}`;
        } catch {}
        throw new Error(errMessage);
      }

      const rawJson = await res.json();
      const json = fixEncoding(rawJson);

      return {
        success: json?.success !== false,
        message: json?.message || 'Otimizacao concluida.',
        raw: json
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na otimizacao.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
