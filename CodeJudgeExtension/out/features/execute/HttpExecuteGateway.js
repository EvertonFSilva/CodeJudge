"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExecuteGateway = void 0;
const EncodingUtils_1 = require("../../core/utils/EncodingUtils");
class HttpExecuteGateway {
    getApiUrl;
    getTimeoutMs;
    logger;
    constructor(getApiUrl, getTimeoutMs, logger) {
        this.getApiUrl = getApiUrl;
        this.getTimeoutMs = getTimeoutMs;
        this.logger = logger;
    }
    async execute(request) {
        const url = `${this.getApiUrl()}/execution/run`;
        const controller = new AbortController();
        const timeoutMs = this.getTimeoutMs();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        this.logger.debug(`Requisitando execucao em ${url}`);
        try {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            };
            if (request.apiKey) {
                headers['X-Api-Key'] = request.apiKey;
            }
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    statement: request.statement || '',
                    language: request.language,
                    code: request.code,
                    tests: request.tests || [],
                    apiKey: request.apiKey || undefined,
                    engine: request.engine || undefined,
                    model: request.model || undefined
                }),
                signal: controller.signal
            });
            if (!res.ok) {
                let errMessage = `HTTP ${res.status}`;
                try {
                    const json = await res.json();
                    if (json?.message)
                        errMessage += `: ${json.message}`;
                }
                catch { }
                throw new Error(errMessage);
            }
            const rawJson = await res.json();
            const json = (0, EncodingUtils_1.fixEncoding)(rawJson);
            const rawOutputs = json?.outputs || [];
            const hasTests = Array.isArray(request.tests) && request.tests.length > 0;
            let testResults = [];
            let successRate = undefined;
            let allPassed = true;
            if (hasTests) {
                testResults = this.parseOutputs(rawOutputs);
                const hasExpected = testResults.some(t => t.expected && t.expected.trim() !== '');
                if (hasExpected) {
                    const passedCount = testResults.filter(t => t.passed).length;
                    successRate = Math.round((passedCount / testResults.length) * 100);
                    allPassed = passedCount === testResults.length;
                }
                else {
                    allPassed = json?.success !== false;
                }
            }
            else {
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
        }
        catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Tempo limite de ${timeoutMs / 1000}s esgotado na execucao.`);
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
    parseOutputs(outputs) {
        if (!Array.isArray(outputs))
            return [];
        return outputs.map(item => {
            const input = typeof item === 'object' ? item.input || '' : '';
            const actual = typeof item === 'object' ? item.actual ?? item.output ?? '' : String(item);
            const expected = typeof item === 'object' ? item.expected || '' : '';
            const passed = item?.passed !== undefined
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
exports.HttpExecuteGateway = HttpExecuteGateway;
//# sourceMappingURL=HttpExecuteGateway.js.map