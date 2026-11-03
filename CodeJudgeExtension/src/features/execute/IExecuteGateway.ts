import { TestCaseInput, TestCaseResult } from '../../core/entities/TestCase';
import { BaseStageRequest, BaseStageResponse } from '../../core/entities/StageContract';

export interface ExecuteRequest extends BaseStageRequest {
  tests: TestCaseInput[];
}

export interface ExecuteResponse extends BaseStageResponse {
  testResults: TestCaseResult[];
  successRate?: number;
}

export interface IExecuteGateway {
  execute(request: ExecuteRequest): Promise<ExecuteResponse>;
}
