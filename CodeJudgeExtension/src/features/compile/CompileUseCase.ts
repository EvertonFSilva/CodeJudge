import { ICompileGateway } from './ICompileGateway';
import { ILogger } from '../../core/logger/ILogger';
import { StageExecutionResult } from '../../core/entities/Report';

export class CompileUseCase {
  constructor(
    private readonly gateway: ICompileGateway,
    private readonly logger: ILogger
  ) {}

  public async execute(language: string, code: string, statement?: string): Promise<StageExecutionResult> {
    const startTime = Date.now();
    this.logger.stageStart('compile', { language, codeLength: code.length });

    try {
      const response = await this.gateway.compile({ language, code, statement });
      const durationMs = Date.now() - startTime;

      this.logger.stageEnd('compile', durationMs, response.success, response.message);

      return {
        success: response.success,
        message: response.message,
        data: response.raw,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.stageEnd('compile', durationMs, false, err?.message);
      throw err;
    }
  }
}
