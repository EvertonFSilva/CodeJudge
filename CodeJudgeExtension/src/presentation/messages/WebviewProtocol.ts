import { EditorFileState } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { RunProcessRequest, ProcessResult, StageProgress, ProcessConfig } from '../../features/process/ProcessDTO';
import { LoadPromptsResult, ViewPromptRequest } from '../../features/prompts/PromptDTO';

export type WebviewIncomingMessage =
  | { type: 'request-active-editor' }
  | { type: 'request-health' }
  | { type: 'start-process'; payload: RunProcessRequest }
  | { type: 'load-prompts' }
  | { type: 'view-prompt'; payload: ViewPromptRequest }
  | { type: 'open-file-preview'; payload: { filePath: string } }
  | { type: 'show-error'; payload: { message: string } }
  | { type: 'export-pdf'; payload: { base64?: string; filePath?: string } };

export type WebviewOutgoingMessage =
  | { type: 'active-editor-changed'; payload: EditorFileState }
  | { type: 'health-status'; payload: { online: boolean; apiUrl: string } }
  | { type: 'process-started'; payload: { config: ProcessConfig } }
  | { type: 'stage-progress'; payload: StageProgress }
  | { type: 'process-finished'; payload: ProcessResult }
  | { type: 'process-error'; payload: { message: string } }
  | { type: 'prompts-loaded'; payload: LoadPromptsResult }
  | { type: 'prompts-error'; payload: { message: string } };
