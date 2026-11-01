export interface LoadPromptsResult {
  templates: Record<string, Record<string, any>>;
}

export interface ViewPromptRequest {
  category: string;
  promptKey: string;
}

export interface ViewPromptResult {
  filePath: string;
  content: string;
  category: string;
  promptKey: string;
}
