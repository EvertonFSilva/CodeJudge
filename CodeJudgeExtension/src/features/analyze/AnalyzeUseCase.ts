import { IAnalyzeGateway } from './IAnalyzeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { StageExecutionResult } from '../../core/entities/Report';

export class AnalyzeUseCase {
  constructor(
    private readonly gateway: IAnalyzeGateway,
    private readonly logger: ILogger
  ) {}

  public async execute(
    language: string,
    code: string,
    statement?: string,
    aiOptions?: { apiKey?: string; engine?: string; model?: string }
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    this.logger.stageStart('analyze', { language });

    try {
      const response = await this.gateway.analyze({
        language,
        code,
        statement,
        apiKey: aiOptions?.apiKey,
        engine: aiOptions?.engine,
        model: aiOptions?.model
      });
      const durationMs = Date.now() - startTime;

      this.logger.stageEnd('analyze', durationMs, response.success, response.message);

      return {
        success: response.success,
        message: response.message,
        data: response.raw,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.stageEnd('analyze', durationMs, false, err?.message);
      throw err;
    }
  }
}
