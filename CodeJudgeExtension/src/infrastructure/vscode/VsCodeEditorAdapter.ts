import * as vscode from 'vscode';
import * as path from 'path';
import { IVsCodeEditorAdapter, EditorFileState } from './IVsCodeEditorAdapter';
import { LanguageRegistry } from '../../core/languages/LanguageRegistry';

export class VsCodeEditorAdapter implements IVsCodeEditorAdapter {
  private lastCodeEditor?: vscode.TextEditor;

  constructor(private readonly languageRegistry: LanguageRegistry) {}

  public getState(): EditorFileState {
    const editor = this.resolveTargetCodeEditor();
    if (!editor) {
      return { hasEditor: false, isSupported: false };
    }

    const doc = editor.document;
    const fileName = path.basename(doc.fileName);
    const rawLang = doc.languageId.toLowerCase();

    const matched =
      this.languageRegistry.getById(rawLang) || this.languageRegistry.getByFileName(fileName);

    return {
      hasEditor: true,
      fileName,
      languageId: matched ? matched.id : rawLang,
      isSupported: Boolean(matched),
      codeLength: doc.getText().trim().length
    };
  }

  public getFullCode(): string | null {
    const editor = this.resolveTargetCodeEditor();
    return editor ? editor.document.getText() : null;
  }

  public async openMarkdownSidePreview(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    try {
      await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
    } catch {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
    }
  }

  public showInfo(message: string): void {
    vscode.window.showInformationMessage(`CodeJudge: ${message}`);
  }

  public showError(message: string): void {
    vscode.window.showErrorMessage(`CodeJudge: ${message}`);
  }

  public showWarning(message: string): void {
    vscode.window.showWarningMessage(`CodeJudge: ${message}`);
  }

  public async showActionInfo(message: string, ...items: string[]): Promise<string | undefined> {
    return vscode.window.showInformationMessage(`CodeJudge: ${message}`, ...items);
  }

  public async openExternal(filePath: string): Promise<boolean> {
    return vscode.env.openExternal(vscode.Uri.file(filePath));
  }

  public async revealInOS(filePath: string): Promise<void> {
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
  }

  public async withProgress<T>(title: string, task: () => Promise<T>): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `CodeJudge: ${title}`,
        cancellable: false
      },
      task
    );
  }

  public async promptSavePath(defaultName: string, filterName: string, ext: string): Promise<string | undefined> {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultName),
      filters: { [filterName]: [ext] },
      title: 'Salvar Relatorio CodeJudge'
    });
    return uri?.fsPath;
  }

  public onEditorChanged(callback: (state: EditorFileState) => void): { dispose: () => void } {
    const d1 = vscode.window.onDidChangeActiveTextEditor(() => {
      callback(this.getState());
    });
    const d2 = vscode.window.onDidChangeVisibleTextEditors(() => {
      callback(this.getState());
    });
    return {
      dispose: () => {
        d1.dispose();
        d2.dispose();
      }
    };
  }

  private resolveTargetCodeEditor(): vscode.TextEditor | undefined {
    const active = vscode.window.activeTextEditor;
    if (active && this.isCodeEditor(active)) {
      this.lastCodeEditor = active;
      return active;
    }

    const visibleCode = vscode.window.visibleTextEditors.find(e => this.isCodeEditor(e));
    if (visibleCode) {
      this.lastCodeEditor = visibleCode;
      return visibleCode;
    }

    if (this.lastCodeEditor && !this.lastCodeEditor.document.isClosed) {
      return this.lastCodeEditor;
    }

    return undefined;
  }

  private isCodeEditor(editor: vscode.TextEditor): boolean {
    const doc = editor.document;
    const fileName = path.basename(doc.fileName);
    if (
      fileName.startsWith('codejudge_relatorio_') ||
      fileName.startsWith('codejudge_prompt_') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.pdf')
    ) {
      return false;
    }
    const rawLang = doc.languageId.toLowerCase();
    return Boolean(this.languageRegistry.getById(rawLang) || this.languageRegistry.getByFileName(fileName));
  }
}
