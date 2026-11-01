import { IExecuteGateway } from './IExecuteGateway';
import { TestCaseInput, TestCaseResult } from '../../core/entities/TestCase';
import { ILogger } from '../../core/logger/ILogger';
import { StageExecutionResult } from '../../core/entities/Report';

export interface ExecuteResultDTO extends StageExecutionResult {
  testResults: TestCaseResult[];
  successRate?: number;
}

export class ExecuteUseCase {
  constructor(
    private readonly gateway: IExecuteGateway,
    private readonly logger: ILogger
  ) {}

  public async execute(
    language: string,
    code: string,
    tests: TestCaseInput[],
    statement?: string
  ): Promise<ExecuteResultDTO> {
    const startTime = Date.now();
    this.logger.stageStart('execute', { language, testsCount: tests.length });

    try {
      const response = await this.gateway.execute({ language, code, tests, statement });
      const durationMs = Date.now() - startTime;

      this.logger.stageEnd(
        'execute',
        durationMs,
        response.success,
        `Taxa: ${response.successRate}% (${response.testResults.length} testes)`
      );

      return {
        success: response.success,
        message: response.message,
        testResults: response.testResults,
        successRate: response.successRate,
        data: response.raw,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.stageEnd('execute', durationMs, false, err?.message);
      throw err;
    }
  }
}
