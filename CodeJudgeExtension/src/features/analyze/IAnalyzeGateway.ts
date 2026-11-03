export interface AnalyzeRequest {
  language: string;
  code: string;
  statement?: string;
  apiKey?: string;
  engine?: string;
  model?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
  raw?: any;
}

export interface IAnalyzeGateway {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
}
