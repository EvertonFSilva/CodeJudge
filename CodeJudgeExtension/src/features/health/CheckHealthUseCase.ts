import { ILogger } from '../../core/logger/ILogger';

export class CheckHealthUseCase {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<boolean> {
    const url = `${this.getApiUrl()}/health`;
    this.logger.debug(`Verificando conectividade do servidor em ${url}`);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, { method: 'GET', signal: controller.signal }).catch(async () => {
        return await fetch(`${this.getApiUrl()}/`, { method: 'GET', signal: controller.signal });
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
}
