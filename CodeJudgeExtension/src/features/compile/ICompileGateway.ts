export interface CompileRequest {
  language: string;
  code: string;
  statement?: string;
  apiKey?: string;
  engine?: string;
  model?: string;
}

export interface CompileResponse {
  success: boolean;
  message: string;
  raw?: any;
}

export interface ICompileGateway {
  compile(request: CompileRequest): Promise<CompileResponse>;
}
