export interface PromptDocument {
  name: string;
  description: string;
  category: string;
  content: string;
}

export interface PromptListResponse {
  templates: PromptDocument[];
}
