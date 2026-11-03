export interface AiRequestOptions {
  apiKey?: string;
  engine?: string;
  model?: string;
}

export interface BaseStageRequest extends AiRequestOptions {
  language: string;
  code: string;
  statement?: string;
}

export interface BaseStageResponse {
  success: boolean;
  message: string;
  raw?: any;
}
