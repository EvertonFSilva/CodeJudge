export interface TestCaseInput {
  input: string;
  expected?: string;
}

export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}
