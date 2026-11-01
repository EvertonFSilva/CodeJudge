export interface ILogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: any): void;
  debug(message: string, context?: any): void;
  stageStart(stageName: string, meta?: any): void;
  stageEnd(stageName: string, durationMs: number, success: boolean, details?: any): void;
  show(): void;
}
