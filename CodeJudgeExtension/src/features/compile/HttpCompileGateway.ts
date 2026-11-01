import { ICompileGateway, CompileRequest, CompileResponse } from './ICompileGateway';
import { ILogger } from '../../core/logger/ILogger';
import { fixEncoding } from '../../core/utils/EncodingUtils';

export class HttpCompileGateway implements ICompileGateway {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly getTimeoutMs: () => number,
    private readonly logger: ILogger
  ) {}

  public async compile(request: CompileRequest): Promise<CompileResponse> {
    const url = `${this.getApiUrl()}/compilation/run`;
    const controller = new AbortController();
    const timeoutMs = this.getTimeoutMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.debug(`Requisitando compilacao em ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          statement: request.statement || '',
          language: request.language,
          code: request.code
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
        message: json?.message || (json?.success !== false ? 'Codigo compilado com sucesso.' : 'Erro de compilacao.'),
        raw: json
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na compilacao.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
