import { IExecuteGateway, ExecuteRequest, ExecuteResponse } from './IExecuteGateway';
import { TestCaseResult } from '../../core/entities/TestCase';
import { ILogger } from '../../core/logger/ILogger';
import { fixEncoding } from '../../core/utils/EncodingUtils';

export class HttpExecuteGateway implements IExecuteGateway {
  constructor(
    private readonly getApiUrl: () => string,
    private readonly getTimeoutMs: () => number,
    private readonly logger: ILogger
  ) {}

  public async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    const url = `${this.getApiUrl()}/execution/run`;
    const controller = new AbortController();
    const timeoutMs = this.getTimeoutMs();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.debug(`Requisitando execucao em ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          statement: request.statement || '',
          language: request.language,
          code: request.code,
          tests: request.tests || []
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          if (json?.message) errMessage += `: ${json.message}`;
        } catch {}
        throw new Error(errMessage);
      }

      const rawJson = await res.json();
      const json = fixEncoding(rawJson);
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
        testResults = [];
        successRate = undefined;
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na execucao.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
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
