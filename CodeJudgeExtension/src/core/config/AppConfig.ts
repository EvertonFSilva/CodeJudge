export interface ApiConfig {
  baseUrl: string;
  timeoutSeconds: number;
}

export interface AppConfig {
  api: ApiConfig;
}
