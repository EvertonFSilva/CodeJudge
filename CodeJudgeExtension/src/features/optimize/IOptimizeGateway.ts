import { BaseStageRequest, BaseStageResponse } from '../../core/entities/StageContract';

export type OptimizeRequest = BaseStageRequest;
export type OptimizeResponse = BaseStageResponse;

export interface IOptimizeGateway {
  optimize(request: OptimizeRequest): Promise<OptimizeResponse>;
}
