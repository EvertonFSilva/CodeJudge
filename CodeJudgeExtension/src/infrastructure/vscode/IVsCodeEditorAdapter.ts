export interface EditorFileState {
  hasEditor: boolean;
  fileName?: string;
  languageId?: string;
  isSupported: boolean;
  codeLength?: number;
}

export interface IVsCodeEditorAdapter {
  getState(): EditorFileState;
  getFullCode(): string | null;
  openMarkdownSidePreview(filePath: string): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  showWarning(message: string): void;
  showActionInfo(message: string, ...items: string[]): Promise<string | undefined>;
  openExternal(filePath: string): Promise<boolean>;
  revealInOS(filePath: string): Promise<void>;
  withProgress<T>(title: string, task: () => Promise<T>): Promise<T>;
  promptSavePath(defaultName: string, filterName: string, ext: string): Promise<string | undefined>;
  onEditorChanged(callback: (state: EditorFileState) => void): { dispose: () => void };
}
