import { IOptimizeGateway } from './IOptimizeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { StageExecutionResult } from '../../core/entities/Report';

export class OptimizeUseCase {
  constructor(
    private readonly gateway: IOptimizeGateway,
    private readonly logger: ILogger
  ) {}

  public async execute(
    language: string,
    code: string,
    statement?: string,
    aiOptions?: { apiKey?: string; engine?: string; model?: string }
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    this.logger.stageStart('optimize', { language });

    try {
      const response = await this.gateway.optimize({
        language,
        code,
        statement,
        apiKey: aiOptions?.apiKey,
        engine: aiOptions?.engine,
        model: aiOptions?.model
      });
      const durationMs = Date.now() - startTime;

      this.logger.stageEnd('optimize', durationMs, response.success, response.message);

      return {
        success: response.success,
        message: response.message,
        data: response.raw,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.stageEnd('optimize', durationMs, false, err?.message);
      throw err;
    }
  }
}
