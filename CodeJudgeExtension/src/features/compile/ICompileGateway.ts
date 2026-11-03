import { BaseStageRequest, BaseStageResponse } from '../../core/entities/StageContract';

export type CompileRequest = BaseStageRequest;
export type CompileResponse = BaseStageResponse;

export interface ICompileGateway {
  compile(request: CompileRequest): Promise<CompileResponse>;
}
