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
exports.CodeJudgeSidebarProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CodeJudgeSidebarProvider {
    extensionUri;
    processController;
    promptController;
    healthController;
    pdfExportUseCase;
    editorAdapter;
    syncLanguagesUseCase;
    logger;
    static viewType = 'codejudge.sidebarView';
    view;
    editorChangeSubscription;
    constructor(extensionUri, processController, promptController, healthController, pdfExportUseCase, editorAdapter, syncLanguagesUseCase, logger) {
        this.extensionUri = extensionUri;
        this.processController = processController;
        this.promptController = promptController;
        this.healthController = healthController;
        this.pdfExportUseCase = pdfExportUseCase;
        this.editorAdapter = editorAdapter;
        this.syncLanguagesUseCase = syncLanguagesUseCase;
        this.logger = logger;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.renderHtml();
        webviewView.webview.onDidReceiveMessage(async (data) => {
            await this.handleMessage(data);
        });
        this.editorChangeSubscription?.dispose();
        this.editorChangeSubscription = this.editorAdapter.onEditorChanged(state => {
            this.postMessage({
                type: 'active-editor-changed',
                payload: state
            });
        });
        this.syncLanguagesUseCase.execute().then(() => {
            this.postMessage({
                type: 'active-editor-changed',
                payload: this.editorAdapter.getState()
            });
        }).catch(() => {
            this.postMessage({
                type: 'active-editor-changed',
                payload: this.editorAdapter.getState()
            });
        });
        setTimeout(() => {
            this.postMessage({
                type: 'active-editor-changed',
                payload: this.editorAdapter.getState()
            });
        }, 100);
    }
    updateActiveEditorState() {
        this.postMessage({
            type: 'active-editor-changed',
            payload: this.editorAdapter.getState()
        });
    }
    refresh() {
        if (this.view) {
            this.view.webview.html = this.renderHtml();
            this.logger.debug('Interface recarregada.');
        }
    }
    async handleMessage(message) {
        if (!message || !message.type)
            return;
        switch (message.type) {
            case 'request-active-editor': {
                await this.syncLanguagesUseCase.execute();
                this.postMessage({
                    type: 'active-editor-changed',
                    payload: this.editorAdapter.getState()
                });
                break;
            }
            case 'request-health': {
                const [health] = await Promise.all([
                    this.healthController.check(),
                    this.syncLanguagesUseCase.execute()
                ]);
                this.postMessage({
                    type: 'health-status',
                    payload: health
                });
                this.postMessage({
                    type: 'active-editor-changed',
                    payload: this.editorAdapter.getState()
                });
                break;
            }
            case 'start-process': {
                try {
                    this.postMessage({
                        type: 'process-started',
                        payload: { config: message.payload.config }
                    });
                    const result = await this.processController.handleRun(message.payload, progress => {
                        this.postMessage({
                            type: 'stage-progress',
                            payload: progress
                        });
                    });
                    this.postMessage({
                        type: 'process-finished',
                        payload: result
                    });
                }
                catch (err) {
                    this.logger.error('Erro no processamento', err);
                    this.postMessage({
                        type: 'process-error',
                        payload: { message: err?.message || 'Erro inesperado ao processar codigo.' }
                    });
                }
                break;
            }
            case 'load-prompts': {
                try {
                    const result = await this.promptController.handleLoadAll();
                    this.postMessage({
                        type: 'prompts-loaded',
                        payload: result
                    });
                }
                catch (err) {
                    this.postMessage({
                        type: 'prompts-error',
                        payload: { message: err?.message || 'Falha ao buscar catálogo de prompts.' }
                    });
                }
                break;
            }
            case 'view-prompt': {
                try {
                    await this.promptController.handleViewPrompt(message.payload);
                }
                catch (err) {
                    this.editorAdapter.showError(err?.message || 'Erro ao carregar prompt.');
                }
                break;
            }
            case 'open-file-preview': {
                if (message.payload.filePath) {
                    await this.editorAdapter.openMarkdownSidePreview(message.payload.filePath);
                }
                break;
            }
            case 'show-error': {
                if (message.payload?.message) {
                    this.editorAdapter.showError(message.payload.message);
                }
                break;
            }
            case 'export-pdf': {
                const target = message.payload.filePath || message.payload.base64;
                if (target) {
                    await this.pdfExportUseCase.execute(target);
                }
                break;
            }
        }
    }
    postMessage(message) {
        this.view?.webview.postMessage(message);
    }
    renderHtml() {
        const assetsFolder = path.join(this.extensionUri.fsPath, 'src', 'presentation', 'webview', 'assets');
        try {
            const htmlPath = path.join(assetsFolder, 'templates', 'index.html');
            const cssPath = path.join(assetsFolder, 'styles', 'style.css');
            const jsPath = path.join(assetsFolder, 'scripts', 'app.js');
            let html = fs.readFileSync(htmlPath, 'utf8');
            const css = fs.readFileSync(cssPath, 'utf8');
            const js = fs.readFileSync(jsPath, 'utf8');
            html = html.replace('{{STYLE_PLACEHOLDER}}', css);
            html = html.replace('{{SCRIPT_PLACEHOLDER}}', js);
            return html;
        }
        catch (err) {
            return `<h3>Erro ao carregar os assets da interface: ${err}</h3>`;
        }
    }
}
exports.CodeJudgeSidebarProvider = CodeJudgeSidebarProvider;
//# sourceMappingURL=CodeJudgeSidebarProvider.js.map