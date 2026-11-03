import { BaseStageRequest, BaseStageResponse } from '../../core/entities/StageContract';

export type AnalyzeRequest = BaseStageRequest;
export type AnalyzeResponse = BaseStageResponse;

export interface IAnalyzeGateway {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
}
