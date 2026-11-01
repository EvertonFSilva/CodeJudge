import { CheckHealthUseCase } from '../../features/health/CheckHealthUseCase';

export class HealthController {
  constructor(
    private readonly healthUseCase: CheckHealthUseCase,
    private readonly getApiUrl: () => string
  ) {}

  public async check(): Promise<{ online: boolean; apiUrl: string }> {
    const online = await this.healthUseCase.execute();
    return {
      online,
      apiUrl: this.getApiUrl()
    };
  }
}
