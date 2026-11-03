import * as vscode from 'vscode';

import { ConfigLoader } from './core/config/ConfigLoader';
import { LanguageRegistry } from './core/languages/LanguageRegistry';
import { VsCodeOutputLogger } from './core/logger/VsCodeOutputLogger';

import { VsCodeEditorAdapter } from './infrastructure/vscode/VsCodeEditorAdapter';
import { FileStorageService } from './infrastructure/storage/FileStorageService';

import { HttpLanguageGateway } from './features/languages/HttpLanguageGateway';
import { SyncLanguagesUseCase } from './features/languages/SyncLanguagesUseCase';

import { HttpCompileGateway } from './features/compile/HttpCompileGateway';
import { CompileUseCase } from './features/compile/CompileUseCase';

import { HttpExecuteGateway } from './features/execute/HttpExecuteGateway';
import { ExecuteUseCase } from './features/execute/ExecuteUseCase';

import { HttpAnalyzeGateway } from './features/analyze/HttpAnalyzeGateway';
import { AnalyzeUseCase } from './features/analyze/AnalyzeUseCase';

import { HttpOptimizeGateway } from './features/optimize/HttpOptimizeGateway';
import { OptimizeUseCase } from './features/optimize/OptimizeUseCase';

import { ProcessUseCase } from './features/process/ProcessUseCase';
import { ProcessController } from './presentation/controllers/ProcessController';

import { HttpPromptGateway } from './features/prompts/HttpPromptGateway';
import { LoadPromptsUseCase } from './features/prompts/LoadPromptsUseCase';
import { ViewPromptUseCase } from './features/prompts/ViewPromptUseCase';
import { PromptController } from './presentation/controllers/PromptController';

import { CheckHealthUseCase } from './features/health/CheckHealthUseCase';
import { HealthController } from './presentation/controllers/HealthController';

import { PdfKitReportGenerator } from './features/pdf/PdfKitReportGenerator';
import { PdfExportUseCase } from './features/pdf/PdfExportUseCase';

import { CodeJudgeSidebarProvider } from './presentation/webview/CodeJudgeSidebarProvider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  ConfigLoader.load(context.extensionPath);
  const logger = new VsCodeOutputLogger('CodeJudge');
  logger.info('Iniciando extensao CodeJudge.');

  const languageRegistry = new LanguageRegistry();
  const getApiUrl = () => ConfigLoader.load(context.extensionPath).api.baseUrl;
  const getTimeoutMs = () => ConfigLoader.load(context.extensionPath).api.timeoutSeconds * 1000;

  const languageGateway = new HttpLanguageGateway(getApiUrl, logger);
  const syncLanguagesUseCase = new SyncLanguagesUseCase(languageGateway, languageRegistry, logger);

  await syncLanguagesUseCase.execute();

  const editorAdapter = new VsCodeEditorAdapter(languageRegistry);
  const storageService = new FileStorageService();

  const compileGateway = new HttpCompileGateway(getApiUrl, getTimeoutMs, logger);
  const compileUseCase = new CompileUseCase(compileGateway, logger);

  const executeGateway = new HttpExecuteGateway(getApiUrl, getTimeoutMs, logger);
  const executeUseCase = new ExecuteUseCase(executeGateway, logger);

  const analyzeGateway = new HttpAnalyzeGateway(getApiUrl, getTimeoutMs, logger);
  const analyzeUseCase = new AnalyzeUseCase(analyzeGateway, logger);

  const optimizeGateway = new HttpOptimizeGateway(getApiUrl, getTimeoutMs, logger);
  const optimizeUseCase = new OptimizeUseCase(optimizeGateway, logger);

  const processUseCase = new ProcessUseCase(
    compileUseCase,
    executeUseCase,
    analyzeUseCase,
    optimizeUseCase,
    storageService,
    editorAdapter,
    languageRegistry,
    logger
  );

  const processController = new ProcessController(processUseCase, editorAdapter);

  const promptGateway = new HttpPromptGateway(getApiUrl, logger);
  const loadPromptsUseCase = new LoadPromptsUseCase(promptGateway, logger);
  const viewPromptUseCase = new ViewPromptUseCase(promptGateway, storageService, logger);
  const promptController = new PromptController(loadPromptsUseCase, viewPromptUseCase, editorAdapter);

  const healthUseCase = new CheckHealthUseCase(getApiUrl, logger);
  const healthController = new HealthController(healthUseCase, getApiUrl);

  const pdfGenerator = new PdfKitReportGenerator();
  const pdfExportUseCase = new PdfExportUseCase(pdfGenerator, editorAdapter, logger);

  const sidebarProvider = new CodeJudgeSidebarProvider(
    context.extensionUri,
    processController,
    promptController,
    healthController,
    pdfExportUseCase,
    editorAdapter,
    syncLanguagesUseCase,
    logger
  );

  const exportPdfCommand = vscode.commands.registerCommand(
    'codejudge.exportPdf',
    async (base64Data: string) => {
      await pdfExportUseCase.execute(base64Data);
    }
  );

  const refreshCommand = vscode.commands.registerCommand('codejudge.refreshWebview', () => {
    ConfigLoader.reset();
    syncLanguagesUseCase.execute(true).then(() => {
      sidebarProvider.refresh();
      editorAdapter.showInfo('Interface do CodeJudge recarregada e linguagens sincronizadas.');
    });
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodeJudgeSidebarProvider.viewType,
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    exportPdfCommand,
    refreshCommand
  );
}

export function deactivate(): void {}
