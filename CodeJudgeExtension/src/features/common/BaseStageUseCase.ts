import { ILogger } from '../../core/logger/ILogger';
import { StageExecutionResult } from '../../core/entities/Report';
import { AiRequestOptions, BaseStageRequest, BaseStageResponse } from '../../core/entities/StageContract';

export abstract class BaseStageUseCase<TReq extends BaseStageRequest = BaseStageRequest> {
  constructor(
    protected readonly stageName: string,
    protected readonly logger: ILogger
  ) {}

  protected abstract invokeGateway(request: TReq): Promise<BaseStageResponse>;

  public async execute(
    language: string,
    code: string,
    statement?: string,
    aiOptions?: AiRequestOptions
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    this.logger.stageStart(this.stageName, { language, codeLength: code.length });

    try {
      const request = {
        language,
        code,
        statement,
        apiKey: aiOptions?.apiKey,
        engine: aiOptions?.engine,
        model: aiOptions?.model
      } as TReq;

      const response = await this.invokeGateway(request);
      const durationMs = Date.now() - startTime;

      this.logger.stageEnd(this.stageName, durationMs, response.success, response.message);

      return {
        success: response.success,
        message: response.message,
        data: response.raw,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.stageEnd(this.stageName, durationMs, false, err?.message);
      throw err;
    }
  }
}
