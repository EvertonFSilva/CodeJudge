import { CheckHealthUseCase, AiModelsPayload } from '../../features/health/CheckHealthUseCase';

export class HealthController {
  constructor(
    private readonly healthUseCase: CheckHealthUseCase,
    private readonly getApiUrl: () => string
  ) {}

  public async check(): Promise<{ online: boolean; apiUrl: string; aiModels?: AiModelsPayload }> {
    const [online, aiModels] = await Promise.all([
      this.healthUseCase.execute(),
      this.healthUseCase.fetchAiModels()
    ]);
    return {
      online,
      apiUrl: this.getApiUrl(),
      aiModels
    };
  }
}
