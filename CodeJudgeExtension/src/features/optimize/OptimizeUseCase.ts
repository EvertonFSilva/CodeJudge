import { IOptimizeGateway, OptimizeRequest, OptimizeResponse } from './IOptimizeGateway';
import { ILogger } from '../../core/logger/ILogger';
import { BaseStageUseCase } from '../common/BaseStageUseCase';

export class OptimizeUseCase extends BaseStageUseCase<OptimizeRequest> {
  constructor(
    private readonly gateway: IOptimizeGateway,
    logger: ILogger
  ) {
    super('optimize', logger);
  }

  protected invokeGateway(request: OptimizeRequest): Promise<OptimizeResponse> {
    return this.gateway.optimize(request);
  }
}
