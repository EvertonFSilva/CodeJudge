import { ILogger } from '../../core/logger/ILogger';

export interface AiModelsPayload {
  isUserKeyRequired: boolean;
  defaultEngine: string;
  defaultModel: string;
  models: string[];
  providers: Record<string, string[]>;
  engines: Array<{
    key: string;
    name: string;
    defaultModel: string;
    supportedModels: string[];
    requiresApiKey: boolean;
    isDefault: boolean;
  }>;
}

export class CheckHealthUseCase {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<boolean> {
    const baseUrl = this.getApiUrl();
    const url = `${baseUrl}/health`;
    this.logger.debug(`Verificando conectividade do servidor em ${url}`);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { method: 'GET', signal: controller.signal }).catch(async () => {
        return await fetch(`${baseUrl}/ai/models`, { method: 'GET', signal: controller.signal }).catch(async () => {
          return await fetch(`${baseUrl}/`, { method: 'GET', signal: controller.signal });
        });
      });

      clearTimeout(timer);
      const isOnline = res.status < 500;
      this.logger.debug(`Status do servidor: ${isOnline ? 'Online' : 'Offline'}`);
      return isOnline;
    } catch {
      this.logger.debug('Servidor inacessivel.');
      return false;
    }
  }

  public async fetchAiModels(): Promise<AiModelsPayload | undefined> {
    const url = `${this.getApiUrl()}/ai/models`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return undefined;
      const json = await res.json();
      if (!json || typeof json !== 'object') return undefined;
      return {
        isUserKeyRequired: Boolean(json.isUserKeyRequired),
        defaultEngine: String(json.defaultEngine || 'ollama'),
        defaultModel: String(json.defaultModel || 'llama3:latest'),
        models: Array.isArray(json.models) ? json.models : [],
        providers: json.providers && typeof json.providers === 'object' ? json.providers : {},
        engines: Array.isArray(json.engines) ? json.engines : []
      };
    } catch {
      return undefined;
    }
  }
}
