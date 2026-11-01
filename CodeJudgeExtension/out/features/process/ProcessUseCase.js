"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessUseCase = void 0;
const Report_1 = require("../../core/entities/Report");
const AppError_1 = require("../../core/errors/AppError");
class ProcessUseCase {
    compileUseCase;
    executeUseCase;
    analyzeUseCase;
    optimizeUseCase;
    storageService;
    editorAdapter;
    languageRegistry;
    logger;
    stopOnCompilationFailure;
    constructor(compileUseCase, executeUseCase, analyzeUseCase, optimizeUseCase, storageService, editorAdapter, languageRegistry, logger, stopOnCompilationFailure = true) {
        this.compileUseCase = compileUseCase;
        this.executeUseCase = executeUseCase;
        this.analyzeUseCase = analyzeUseCase;
        this.optimizeUseCase = optimizeUseCase;
        this.storageService = storageService;
        this.editorAdapter = editorAdapter;
        this.languageRegistry = languageRegistry;
        this.logger = logger;
        this.stopOnCompilationFailure = stopOnCompilationFailure;
    }
    async execute(request, onProgress) {
        const editorState = this.editorAdapter.getState();
        if (!editorState.hasEditor || !editorState.fileName) {
            this.logger.warn('Tentativa de execucao sem editor ativo.');
            throw new AppError_1.NoActiveEditorError();
        }
        if (!editorState.isSupported || !editorState.languageId) {
            this.logger.warn(`Linguagem nao suportada: ${editorState.languageId}`);
            throw new AppError_1.UnsupportedLanguageError(editorState.languageId || 'desconhecida');
        }
        const code = this.editorAdapter.getFullCode();
        if (!code || code.trim() === '') {
            this.logger.warn('Tentativa de execucao com arquivo de codigo vazio.');
            throw new AppError_1.EmptyCodeError();
        }
        const language = editorState.languageId;
        const fileName = editorState.fileName;
        const statement = request.statement?.trim() || '';
        const config = request.config;
        const tests = request.tests || [];
        this.logger.info(`Processando codigo '${fileName}' (${language}).`);
        const stagesCompleted = [];
        let compilationResult;
        let executionResult;
        let analysisResult;
        let optimizationResult;
        let stoppedEarly = false;
        let stopReason;
        const notify = (progress) => {
            stagesCompleted.push(progress);
            if (onProgress)
                onProgress(progress);
        };
        if (config.compile) {
            notify({
                stage: 'compile',
                status: 'running',
                title: 'Compilando codigo-fonte...'
            });
            try {
                compilationResult = await this.compileUseCase.execute(language, code, statement);
                if (compilationResult.success) {
                    notify({
                        stage: 'compile',
                        status: 'success',
                        title: 'Compilacao concluida com sucesso',
                        durationMs: compilationResult.durationMs,
                        message: compilationResult.message
                    });
                }
                else {
                    if (this.stopOnCompilationFailure) {
                        stoppedEarly = true;
                        stopReason = 'Falha de compilacao';
                    }
                    notify({
                        stage: 'compile',
                        status: 'failed',
                        title: 'Falha na compilacao do codigo',
                        durationMs: compilationResult.durationMs,
                        message: compilationResult.message
                    });
                    if (stoppedEarly) {
                        this.logger.warn('Processamento interrompido por erro de compilacao.');
                        if (config.execute)
                            notify({ stage: 'execute', status: 'skipped', title: 'Execucao suspensa' });
                        if (config.analyze)
                            notify({ stage: 'analyze', status: 'skipped', title: 'Analise suspensa' });
                        if (config.optimize)
                            notify({ stage: 'optimize', status: 'skipped', title: 'Otimizacao suspensa' });
                    }
                }
            }
            catch (err) {
                stoppedEarly = true;
                compilationResult = { success: false, message: err?.message };
                this.logger.error('Erro na compilacao', err);
                notify({
                    stage: 'compile',
                    status: 'failed',
                    title: 'Erro de conexao na compilacao',
                    message: err?.message
                });
            }
        }
        if (!stoppedEarly) {
            if (config.execute) {
                notify({
                    stage: 'execute',
                    status: 'running',
                    title: tests.length > 0 ? `Executando com ${tests.length} caso(s)...` : 'Executando codigo...'
                });
                try {
                    executionResult = await this.executeUseCase.execute(language, code, tests, statement);
                    const hasTests = tests.length > 0 && tests.some(t => (t.input && t.input.trim().length > 0) || (t.expected && t.expected.trim().length > 0));
                    const isSuccess = Boolean(executionResult.success);
                    notify({
                        stage: 'execute',
                        status: isSuccess ? 'success' : 'failed',
                        title: isSuccess
                            ? (hasTests ? 'Execução concluída com sucesso' : 'Execução concluída com sucesso (sem testes)')
                            : 'Divergências encontradas na execução',
                        durationMs: executionResult.durationMs,
                        message: executionResult.message
                    });
                }
                catch (err) {
                    this.logger.error('Erro na execucao', err);
                    executionResult = {
                        success: false,
                        message: err?.message,
                        testResults: [],
                        successRate: tests.length > 0 ? 0 : undefined
                    };
                    notify({
                        stage: 'execute',
                        status: 'failed',
                        title: 'Erro de conexao na execucao',
                        message: err?.message
                    });
                }
            }
            if (config.analyze) {
                notify({
                    stage: 'analyze',
                    status: 'running',
                    title: 'Analisando codigo...'
                });
                try {
                    analysisResult = await this.analyzeUseCase.execute(language, code, statement);
                    notify({
                        stage: 'analyze',
                        status: analysisResult.success ? 'success' : 'failed',
                        title: 'Analise finalizada',
                        durationMs: analysisResult.durationMs,
                        message: analysisResult.message
                    });
                }
                catch (err) {
                    this.logger.error('Erro na analise', err);
                    analysisResult = { success: false, message: err?.message };
                    notify({
                        stage: 'analyze',
                        status: 'failed',
                        title: 'Erro na analise',
                        message: err?.message
                    });
                }
            }
            if (config.optimize) {
                notify({
                    stage: 'optimize',
                    status: 'running',
                    title: 'Avaliando otimizacao...'
                });
                try {
                    optimizationResult = await this.optimizeUseCase.execute(language, code, statement);
                    notify({
                        stage: 'optimize',
                        status: optimizationResult.success ? 'success' : 'failed',
                        title: 'Otimizacao finalizada',
                        durationMs: optimizationResult.durationMs,
                        message: optimizationResult.message
                    });
                }
                catch (err) {
                    this.logger.error('Erro na otimizacao', err);
                    optimizationResult = { success: false, message: err?.message };
                    notify({
                        stage: 'optimize',
                        status: 'failed',
                        title: 'Erro na otimizacao',
                        message: err?.message
                    });
                }
            }
        }
        const hasTests = tests.length > 0 && tests.some(t => (t.input && t.input.trim().length > 0) || (t.expected && t.expected.trim().length > 0));
        const executionSuccessful = !executionResult || Boolean(executionResult.success);
        const allSucceeded = (!compilationResult || compilationResult.success) &&
            executionSuccessful &&
            (!analysisResult || analysisResult.success) &&
            (!optimizationResult || optimizationResult.success);
        const report = new Report_1.Report({
            fileName,
            language,
            code,
            statement,
            compilation: compilationResult,
            execution: executionResult,
            analysis: analysisResult,
            optimization: optimizationResult,
            hasTests,
            allSucceeded,
            stoppedEarly,
            stopReason,
            createdAt: new Date()
        });
        const markdownText = report.toMarkdown();
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
        const tempFile = `codejudge_relatorio_${timestamp}.md`;
        const filePath = this.storageService.saveTemporaryMarkdown(tempFile, markdownText);
        this.logger.info(`Processamento finalizado. Relatorio: ${filePath}`);
        return {
            allSucceeded,
            stoppedEarly,
            markdown: markdownText,
            filePath,
            testResults: hasTests ? executionResult?.testResults : undefined,
            successRate: hasTests ? executionResult?.successRate : undefined,
            stagesCompleted
        };
    }
}
exports.ProcessUseCase = ProcessUseCase;
//# sourceMappingURL=ProcessUseCase.js.map