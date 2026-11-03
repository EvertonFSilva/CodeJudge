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
exports.VsCodeEditorAdapter = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class VsCodeEditorAdapter {
    languageRegistry;
    lastCodeEditor;
    constructor(languageRegistry) {
        this.languageRegistry = languageRegistry;
    }
    getState() {
        const editor = this.resolveTargetCodeEditor();
        if (!editor) {
            return { hasEditor: false, isSupported: false };
        }
        const doc = editor.document;
        const fileName = path.basename(doc.fileName);
        const rawLang = doc.languageId.toLowerCase();
        const matched = this.languageRegistry.getById(rawLang) || this.languageRegistry.getByFileName(fileName);
        return {
            hasEditor: true,
            fileName,
            languageId: matched ? matched.id : rawLang,
            isSupported: Boolean(matched),
            codeLength: doc.getText().trim().length
        };
    }
    getFullCode() {
        const editor = this.resolveTargetCodeEditor();
        return editor ? editor.document.getText() : null;
    }
    async openMarkdownSidePreview(filePath) {
        const uri = vscode.Uri.file(filePath);
        try {
            await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
        }
        catch {
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
        }
    }
    showInfo(message) {
        vscode.window.showInformationMessage(`CodeJudge: ${message}`);
    }
    showError(message) {
        vscode.window.showErrorMessage(`CodeJudge: ${message}`);
    }
    showWarning(message) {
        vscode.window.showWarningMessage(`CodeJudge: ${message}`);
    }
    async showActionInfo(message, ...items) {
        return vscode.window.showInformationMessage(`CodeJudge: ${message}`, ...items);
    }
    async openExternal(filePath) {
        return vscode.env.openExternal(vscode.Uri.file(filePath));
    }
    async revealInOS(filePath) {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
    }
    async withProgress(title, task) {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `CodeJudge: ${title}`,
            cancellable: false
        }, task);
    }
    async promptSavePath(defaultName, filterName, ext) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultName),
            filters: { [filterName]: [ext] },
            title: 'Salvar Relatorio CodeJudge'
        });
        return uri?.fsPath;
    }
    onEditorChanged(callback) {
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
    resolveTargetCodeEditor() {
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
    isCodeEditor(editor) {
        const doc = editor.document;
        const fileName = path.basename(doc.fileName);
        if (fileName.startsWith('codejudge_relatorio_') ||
            fileName.startsWith('codejudge_prompt_') ||
            fileName.endsWith('.md') ||
            fileName.endsWith('.pdf')) {
            return false;
        }
        const rawLang = doc.languageId.toLowerCase();
        return Boolean(this.languageRegistry.getById(rawLang) || this.languageRegistry.getByFileName(fileName));
    }
}
exports.VsCodeEditorAdapter = VsCodeEditorAdapter;
//# sourceMappingURL=VsCodeEditorAdapter.js.map