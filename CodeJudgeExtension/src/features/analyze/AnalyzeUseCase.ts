import { IAnalyzeGateway, AnalyzeRequest, AnalyzeResponse } from './IAnalyzeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseStageUseCase } from '../common/BaseStageUseCase';

export class AnalyzeUseCase extends BaseStageUseCase<AnalyzeRequest> {
  constructor(
    private readonly gateway: IAnalyzeGateway,
    logger: ILogger
  ) {
    super('analyze', logger);
  }

  protected invokeGateway(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.gateway.analyze(request);
  }
}
