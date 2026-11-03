import { TestCaseInput, TestCaseResult } from '../../core/entities/TestCase';

export interface ExecuteRequest {
  language: string;
  code: string;
  statement?: string;
  tests: TestCaseInput[];
  apiKey?: string;
  engine?: string;
  model?: string;
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
