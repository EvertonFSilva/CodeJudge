import { CompileUseCase } from '../compile/CompileUseCase';
import { ExecuteUseCase, ExecuteResultDTO } from '../execute/ExecuteUseCase';
import { AnalyzeUseCase } from '../analyze/AnalyzeUseCase';
import { OptimizeUseCase } from '../optimize/OptimizeUseCase';
import { IFileStorageService } from '../../infrastructure/storage/IFileStorageService';
import { IVsCodeEditorAdapter } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { LanguageRegistry } from '../../core/languages/LanguageRegistry';
import { ILogger } from '../../core/logger/ILogger';
import {
  RunProcessRequest,
  ProcessResult,
  ProcessStage,
  StageProgress
} from './ProcessDTO';
import { Report, StageExecutionResult } from '../../core/entities/Report';
import { AiRequestOptions } from '../../core/entities/StageContract';
import {
  NoActiveEditorError,
  UnsupportedLanguageError,
  EmptyCodeError
} from '../../core/errors/AppError';

export class ProcessUseCase {
  constructor(
    private readonly compileUseCase: CompileUseCase,
    private readonly executeUseCase: ExecuteUseCase,
    private readonly analyzeUseCase: AnalyzeUseCase,
    private readonly optimizeUseCase: OptimizeUseCase,
    private readonly storageService: IFileStorageService,
    private readonly editorAdapter: IVsCodeEditorAdapter,
    private readonly languageRegistry: LanguageRegistry,
    private readonly logger: ILogger,
    private readonly stopOnCompilationFailure = true
  ) {}

  public async execute(
    request: RunProcessRequest,
    onProgress?: (progress: StageProgress) => void
  ): Promise<ProcessResult> {
    const editorState = this.editorAdapter.getState();

    if (!editorState.hasEditor || !editorState.fileName) {
      this.logger.warn('Tentativa de execucao sem editor ativo.');
      throw new NoActiveEditorError();
    }

    if (!editorState.isSupported || !editorState.languageId) {
      this.logger.warn(`Linguagem nao suportada: ${editorState.languageId}`);
      throw new UnsupportedLanguageError(editorState.languageId || 'desconhecida');
    }

    const code = this.editorAdapter.getFullCode();
    if (!code || code.trim() === '') {
      this.logger.warn('Tentativa de execucao com arquivo de codigo vazio.');
      throw new EmptyCodeError();
    }

    const language = editorState.languageId;
    const fileName = editorState.fileName;
    const statement = request.statement?.trim() || '';
    const config = request.config;
    const tests = request.tests || [];
    const aiOptions: AiRequestOptions = {
      apiKey: request.apiKey?.trim() || undefined,
      engine: request.engine?.trim() || undefined,
      model: request.model?.trim() || undefined
    };

    this.logger.info(`Processando codigo '${fileName}' (${language}).`);

    const stagesCompleted: StageProgress[] = [];
    let compilationResult: StageExecutionResult | undefined;
    let executionResult: ExecuteResultDTO | undefined;
    let analysisResult: StageExecutionResult | undefined;
    let optimizationResult: StageExecutionResult | undefined;

    let stoppedEarly = false;
    let stopReason: string | undefined;

    const notify = (progress: StageProgress) => {
      stagesCompleted.push(progress);
      if (onProgress) onProgress(progress);
    };

    if (config.compile) {
      notify({
        stage: 'compile',
        status: 'running',
        title: 'Compilando codigo-fonte...'
      });

      try {
        compilationResult = await this.compileUseCase.execute(language, code, statement, aiOptions);

        if (compilationResult.success) {
          notify({
            stage: 'compile',
            status: 'success',
            title: 'Compilacao concluida com sucesso',
            durationMs: compilationResult.durationMs,
            message: compilationResult.message
          });
        } else {
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
            if (config.execute) notify({ stage: 'execute', status: 'skipped', title: 'Execucao suspensa' });
            if (config.analyze) notify({ stage: 'analyze', status: 'skipped', title: 'Analise suspensa' });
            if (config.optimize) notify({ stage: 'optimize', status: 'skipped', title: 'Otimizacao suspensa' });
          }
        }
      } catch (err: any) {
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
          executionResult = await this.executeUseCase.execute(language, code, tests, statement, aiOptions);

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
        } catch (err: any) {
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
        analysisResult = await this.runAiStage(
          'analyze',
          'Analisando codigo...',
          'Analise finalizada',
          'Erro na analise',
          () => this.analyzeUseCase.execute(language, code, statement, aiOptions),
          notify
        );
      }

      if (config.optimize) {
        optimizationResult = await this.runAiStage(
          'optimize',
          'Avaliando otimizacao...',
          'Otimizacao finalizada',
          'Erro na otimizacao',
          () => this.optimizeUseCase.execute(language, code, statement, aiOptions),
          notify
        );
      }
    }

    const hasTests = tests.length > 0 && tests.some(t => (t.input && t.input.trim().length > 0) || (t.expected && t.expected.trim().length > 0));
    const executionSuccessful = !executionResult || Boolean(executionResult.success);

    const allSucceeded =
      (!compilationResult || compilationResult.success) &&
      executionSuccessful &&
      (!analysisResult || analysisResult.success) &&
      (!optimizationResult || optimizationResult.success);

    const report = new Report({
      fileName,
      language,
      code,
      statement,
      studentProfile: request.studentProfile,
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

  private async runAiStage(
    stage: ProcessStage,
    runningTitle: string,
    finishedTitle: string,
    errorTitle: string,
    action: () => Promise<StageExecutionResult>,
    notify: (progress: StageProgress) => void
  ): Promise<StageExecutionResult> {
    notify({
      stage,
      status: 'running',
      title: runningTitle
    });

    try {
      const result = await action();
      notify({
        stage,
        status: result.success ? 'success' : 'failed',
        title: finishedTitle,
        durationMs: result.durationMs,
        message: result.message
      });
      return result;
    } catch (err: any) {
      this.logger.error(errorTitle, err);
      const fallback: StageExecutionResult = { success: false, message: err?.message };
      notify({
        stage,
        status: 'failed',
        title: errorTitle,
        message: err?.message
      });
      return fallback;
    }
  }
}
