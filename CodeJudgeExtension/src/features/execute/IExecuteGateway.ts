import { TestCaseInput, TestCaseResult } from '../../core/entities/TestCase';

export interface ExecuteRequest {
  language: string;
  code: string;
  statement?: string;
  tests: TestCaseInput[];
}

export interface ExecuteResponse {
  success: boolean;
  message: string;
  testResults: TestCaseResult[];
  successRate?: number;
  raw?: any;
}

export interface IExecuteGateway {
  execute(request: ExecuteRequest): Promise<ExecuteResponse>;
}
