export interface PromptDocument {
  key: string;
  name: string;
  description: string;
  category: string;
  content: string;
}

export interface PromptListResponse {
  templates: Record<
    string,
    Record<
      string,
      {
        metadata: {
          name: string;
          description: string;
        };
        content: string;
      }
    >
  >;
}
