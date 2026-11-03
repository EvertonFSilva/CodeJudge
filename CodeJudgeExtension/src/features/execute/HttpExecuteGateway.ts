import { IExecuteGateway, ExecuteRequest, ExecuteResponse } from './IExecuteGateway';
import { TestCaseResult } from '../../core/entities/TestCase';
import { ILogger } from '../../core/logger/ILogger';
import { BaseHttpGateway } from '../../infrastructure/http/BaseHttpGateway';

export class HttpExecuteGateway extends BaseHttpGateway implements IExecuteGateway {
  constructor(
    getApiUrl: () => string,
    getTimeoutMs: () => number,
    logger: ILogger
  ) {
    super(getApiUrl, logger, getTimeoutMs);
  }

  public async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const json = await this.postJson({
      endpoint: '/execution/run',
      stageLabel: 'execucao',
      apiKey: request.apiKey,
      body: {
        statement: request.statement || '',
        language: request.language,
        code: request.code,
        tests: request.tests || [],
        apiKey: request.apiKey || undefined,
        engine: request.engine || undefined,
        model: request.model || undefined
      }
    });

    const rawOutputs = json?.outputs || [];
    const hasTests = Array.isArray(request.tests) && request.tests.length > 0;

    let testResults: TestCaseResult[] = [];
    let successRate: number | undefined = undefined;
    let allPassed = true;

    if (hasTests) {
      testResults = this.parseOutputs(rawOutputs);
      const hasExpected = testResults.some(t => t.expected && t.expected.trim() !== '');

      if (hasExpected) {
        const passedCount = testResults.filter(t => t.passed).length;
        successRate = Math.round((passedCount / testResults.length) * 100);
        allPassed = passedCount === testResults.length;
      } else {
        allPassed = json?.success !== false;
      }
    } else {
      allPassed = json?.success !== false;
    }

    let message = json?.message;
    if (!message) {
      message = hasTests
        ? `Execucao concluida. ${testResults.length} caso(s) de teste processados.`
        : 'Execucao concluida com sucesso.';
    }

    return {
      success: allPassed && json?.success !== false,
      message,
      testResults,
      successRate,
      raw: json
    };
  }

  private parseOutputs(outputs: any[]): TestCaseResult[] {
    if (!Array.isArray(outputs)) return [];

    return outputs.map(item => {
      const input = typeof item === 'object' ? item.input || '' : '';
      const actual = typeof item === 'object' ? item.actual ?? item.output ?? '' : String(item);
      const expected = typeof item === 'object' ? item.expected || '' : '';

      const passed =
        item?.passed !== undefined
          ? Boolean(item.passed)
          : expected.trim() !== '' && expected.trim() === actual.trim();

      return {
        input: String(input),
        actual: String(actual),
        expected: String(expected),
        passed
      };
    });
  }
}
