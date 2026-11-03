import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IVsCodeEditorAdapter } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { ProcessController } from '../controllers/ProcessController';
import { PromptController } from '../controllers/PromptController';
import { HealthController } from '../controllers/HealthController';
import { PdfExportUseCase } from '../../features/pdf/PdfExportUseCase';
import { SyncLanguagesUseCase } from '../../features/languages/SyncLanguagesUseCase';
import { WebviewIncomingMessage } from '../messages/WebviewProtocol';
import { ILogger } from '../../core/logger/ILogger';

export class CodeJudgeSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codejudge.sidebarView';

  private view?: vscode.WebviewView;
  private editorChangeSubscription?: { dispose: () => void };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly processController: ProcessController,
    private readonly promptController: PromptController,
    private readonly healthController: HealthController,
    private readonly pdfExportUseCase: PdfExportUseCase,
    private readonly editorAdapter: IVsCodeEditorAdapter,
    private readonly syncLanguagesUseCase: SyncLanguagesUseCase,
    private readonly logger: ILogger
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.renderHtml();

    webviewView.webview.onDidReceiveMessage(async (data: WebviewIncomingMessage) => {
      await this.handleMessage(data);
    });

    this.editorChangeSubscription?.dispose();
    this.editorChangeSubscription = this.editorAdapter.onEditorChanged(state => {
      this.postMessage({
        type: 'active-editor-changed',
        payload: state
      });
    });

    Promise.all([
      this.healthController.check(),
      this.syncLanguagesUseCase.execute()
    ]).then(([health]) => {
      this.postMessage({
        type: 'health-status',
        payload: health
      });
      this.updateActiveEditorState();
    });

    setTimeout(() => {
      this.updateActiveEditorState();
    }, 100);
  }

  public updateActiveEditorState(): void {
    this.postMessage({
      type: 'active-editor-changed',
      payload: this.editorAdapter.getState()
    });
  }

  public refresh(): void {
    if (this.view) {
      this.view.webview.html = this.renderHtml();
      this.logger.debug('Interface recarregada.');
    }
  }

  private async handleMessage(message: WebviewIncomingMessage): Promise<void> {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'request-active-editor': {
        await this.syncLanguagesUseCase.execute();
        this.updateActiveEditorState();
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
        this.updateActiveEditorState();
        break;
      }

      case 'start-process': {
        try {
          this.postMessage({
            type: 'process-started',
            payload: { config: message.payload.config }
          });

          const result = await this.processController.handleRun(
            message.payload,
            progress => {
              this.postMessage({
                type: 'stage-progress',
                payload: progress
              });
            }
          );

          this.postMessage({
            type: 'process-finished',
            payload: result
          });
        } catch (err: any) {
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
        } catch (err: any) {
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
        } catch (err: any) {
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

  private postMessage(message: any): void {
    this.view?.webview.postMessage(message);
  }

  private renderHtml(): string {
    const assetsFolder = path.join(
      this.extensionUri.fsPath,
      'src',
      'presentation',
      'webview',
      'assets'
    );

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
    } catch (err) {
      return `<h3>Erro ao carregar os assets da interface: ${err}</h3>`;
    }
  }
}
