"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ConfigLoader_1 = require("./core/config/ConfigLoader");
const LanguageRegistry_1 = require("./core/languages/LanguageRegistry");
const VsCodeOutputLogger_1 = require("./core/logger/VsCodeOutputLogger");
const VsCodeEditorAdapter_1 = require("./infrastructure/vscode/VsCodeEditorAdapter");
const FileStorageService_1 = require("./infrastructure/storage/FileStorageService");
const HttpLanguageGateway_1 = require("./features/languages/HttpLanguageGateway");
const SyncLanguagesUseCase_1 = require("./features/languages/SyncLanguagesUseCase");
const HttpCompileGateway_1 = require("./features/compile/HttpCompileGateway");
const CompileUseCase_1 = require("./features/compile/CompileUseCase");
const HttpExecuteGateway_1 = require("./features/execute/HttpExecuteGateway");
const ExecuteUseCase_1 = require("./features/execute/ExecuteUseCase");
const HttpAnalyzeGateway_1 = require("./features/analyze/HttpAnalyzeGateway");
const AnalyzeUseCase_1 = require("./features/analyze/AnalyzeUseCase");
const HttpOptimizeGateway_1 = require("./features/optimize/HttpOptimizeGateway");
const OptimizeUseCase_1 = require("./features/optimize/OptimizeUseCase");
const ProcessUseCase_1 = require("./features/process/ProcessUseCase");
const ProcessController_1 = require("./presentation/controllers/ProcessController");
const HttpPromptGateway_1 = require("./features/prompts/HttpPromptGateway");
const LoadPromptsUseCase_1 = require("./features/prompts/LoadPromptsUseCase");
const ViewPromptUseCase_1 = require("./features/prompts/ViewPromptUseCase");
const PromptController_1 = require("./presentation/controllers/PromptController");
const CheckHealthUseCase_1 = require("./features/health/CheckHealthUseCase");
const HealthController_1 = require("./presentation/controllers/HealthController");
const MoodleAuthUseCase_1 = require("./features/auth/MoodleAuthUseCase");
const AuthController_1 = require("./presentation/controllers/AuthController");
const PdfKitReportGenerator_1 = require("./features/pdf/PdfKitReportGenerator");
const PdfExportUseCase_1 = require("./features/pdf/PdfExportUseCase");
const CodeJudgeSidebarProvider_1 = require("./presentation/webview/CodeJudgeSidebarProvider");
async function activate(context) {
    ConfigLoader_1.ConfigLoader.load(context.extensionPath);
    const logger = new VsCodeOutputLogger_1.VsCodeOutputLogger('CodeJudge');
    logger.info('Iniciando extensao CodeJudge.');
    const languageRegistry = new LanguageRegistry_1.LanguageRegistry();
    const getApiUrl = () => ConfigLoader_1.ConfigLoader.load(context.extensionPath).api.baseUrl;
    const getTimeoutMs = () => ConfigLoader_1.ConfigLoader.load(context.extensionPath).api.timeoutSeconds * 1000;
    const languageGateway = new HttpLanguageGateway_1.HttpLanguageGateway(getApiUrl, logger);
    const syncLanguagesUseCase = new SyncLanguagesUseCase_1.SyncLanguagesUseCase(languageGateway, languageRegistry, logger);
    await syncLanguagesUseCase.execute();
    const editorAdapter = new VsCodeEditorAdapter_1.VsCodeEditorAdapter(languageRegistry);
    const storageService = new FileStorageService_1.FileStorageService();
    const compileGateway = new HttpCompileGateway_1.HttpCompileGateway(getApiUrl, getTimeoutMs, logger);
    const compileUseCase = new CompileUseCase_1.CompileUseCase(compileGateway, logger);
    const executeGateway = new HttpExecuteGateway_1.HttpExecuteGateway(getApiUrl, getTimeoutMs, logger);
    const executeUseCase = new ExecuteUseCase_1.ExecuteUseCase(executeGateway, logger);
    const analyzeGateway = new HttpAnalyzeGateway_1.HttpAnalyzeGateway(getApiUrl, getTimeoutMs, logger);
    const analyzeUseCase = new AnalyzeUseCase_1.AnalyzeUseCase(analyzeGateway, logger);
    const optimizeGateway = new HttpOptimizeGateway_1.HttpOptimizeGateway(getApiUrl, getTimeoutMs, logger);
    const optimizeUseCase = new OptimizeUseCase_1.OptimizeUseCase(optimizeGateway, logger);
    const processUseCase = new ProcessUseCase_1.ProcessUseCase(compileUseCase, executeUseCase, analyzeUseCase, optimizeUseCase, storageService, editorAdapter, languageRegistry, logger);
    const processController = new ProcessController_1.ProcessController(processUseCase, editorAdapter);
    const promptGateway = new HttpPromptGateway_1.HttpPromptGateway(getApiUrl, logger);
    const loadPromptsUseCase = new LoadPromptsUseCase_1.LoadPromptsUseCase(promptGateway, logger);
    const viewPromptUseCase = new ViewPromptUseCase_1.ViewPromptUseCase(promptGateway, storageService, logger);
    const promptController = new PromptController_1.PromptController(loadPromptsUseCase, viewPromptUseCase, editorAdapter);
    const healthUseCase = new CheckHealthUseCase_1.CheckHealthUseCase(getApiUrl, logger);
    const healthController = new HealthController_1.HealthController(healthUseCase, getApiUrl);
    const moodleAuthUseCase = new MoodleAuthUseCase_1.MoodleAuthUseCase(logger);
    const authController = new AuthController_1.AuthController(moodleAuthUseCase, context.globalState);
    const pdfGenerator = new PdfKitReportGenerator_1.PdfKitReportGenerator();
    const pdfExportUseCase = new PdfExportUseCase_1.PdfExportUseCase(pdfGenerator, editorAdapter, logger);
    const sidebarProvider = new CodeJudgeSidebarProvider_1.CodeJudgeSidebarProvider(context.extensionUri, processController, promptController, healthController, authController, pdfExportUseCase, editorAdapter, syncLanguagesUseCase, logger);
    const exportPdfCommand = vscode.commands.registerCommand('codejudge.exportPdf', async (base64Data) => {
        await pdfExportUseCase.execute(base64Data);
    });
    const refreshCommand = vscode.commands.registerCommand('codejudge.refreshWebview', () => {
        ConfigLoader_1.ConfigLoader.reset();
        syncLanguagesUseCase.execute(true).then(() => {
            sidebarProvider.refresh();
            editorAdapter.showInfo('Interface do CodeJudge recarregada e linguagens sincronizadas.');
        });
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CodeJudgeSidebarProvider_1.CodeJudgeSidebarProvider.viewType, sidebarProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }), exportPdfCommand, refreshCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map