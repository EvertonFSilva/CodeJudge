export interface OptimizeRequest {
  language: string;
  code: string;
  statement?: string;
}

export interface OptimizeResponse {
  success: boolean;
  message: string;
  raw?: any;
}

export interface IOptimizeGateway {
  optimize(request: OptimizeRequest): Promise<OptimizeResponse>;
}
