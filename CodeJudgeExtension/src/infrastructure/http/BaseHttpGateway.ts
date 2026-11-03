import { ILogger } from '../../core/logger/ILogger';
import { fixEncoding } from '../../core/utils/EncodingUtils';

export interface HttpPostOptions {
  endpoint: string;
  body: Record<string, any>;
  stageLabel: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface HttpGetOptions {
  endpoint: string;
  errorMessage: string;
  timeoutMs?: number;
}

export abstract class BaseHttpGateway {
  constructor(
    protected readonly getApiUrl: () => string,
    protected readonly logger: ILogger,
    protected readonly getTimeoutMs: () => number = () => 30000
  ) {}

  protected buildHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (apiKey && apiKey.trim()) {
      headers['X-Api-Key'] = apiKey.trim();
    }
    return headers;
  }

  protected async postJson<T = any>(options: HttpPostOptions): Promise<T> {
    const url = `${this.getApiUrl()}${options.endpoint}`;
    const timeoutMs = options.timeoutMs ?? this.getTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.debug(`Requisitando ${options.stageLabel} em ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(options.apiKey),
        body: JSON.stringify(options.body),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) {
            errMessage += `: ${errJson.message}`;
          }
        } catch {}
        throw new Error(errMessage);
      }

      const rawJson = await res.json();
      return fixEncoding(rawJson) as T;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na ${options.stageLabel}.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  protected async getJson<T = any>(options: HttpGetOptions): Promise<T> {
    const url = `${this.getApiUrl()}${options.endpoint}`;
    const timeoutMs = options.timeoutMs ?? this.getTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.debug(`Consultando ${url}`);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`${options.errorMessage} (HTTP ${res.status})`);
      }

      const rawJson = await res.json();
      return fixEncoding(rawJson) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
