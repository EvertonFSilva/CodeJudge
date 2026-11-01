import * as vscode from 'vscode';
import { ILogger } from './ILogger';

export class VsCodeOutputLogger implements ILogger {
  private readonly channel: vscode.OutputChannel;

  constructor(channelName = 'CodeJudge') {
    this.channel = vscode.window.createOutputChannel(channelName);
  }

  public info(message: string, context?: any): void {
    this.write('INFO', message, context);
  }

  public warn(message: string, context?: any): void {
    this.write('WARN', message, context);
  }

  public error(message: string, error?: any): void {
    this.write('ERROR', message, error);
  }

  public debug(message: string, context?: any): void {
    this.write('DEBUG', message, context);
  }

  public stageStart(stageName: string, meta?: any): void {
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    this.write('STAGE:START', `[${stageName.toUpperCase()}] Iniciando etapa${metaStr}`);
  }

  public stageEnd(stageName: string, durationMs: number, success: boolean, details?: any): void {
    const status = success ? 'SUCESSO' : 'FALHA';
    const detailStr = details ? ` | ${typeof details === 'string' ? details : JSON.stringify(details)}` : '';
    this.write('STAGE:END', `[${stageName.toUpperCase()}] Finalizado em ${durationMs}ms - Status: ${status}${detailStr}`);
  }

  public show(): void {
    this.channel.show(true);
  }

  private write(level: string, message: string, extra?: any): void {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let line = `[${now}] [${level}] ${message}`;

    if (extra !== undefined) {
      if (extra instanceof Error) {
        line += `\n${extra.stack || extra.message}`;
      } else if (typeof extra === 'object') {
        try {
          line += `\n${JSON.stringify(extra, null, 2)}`;
        } catch {
          line += `\n${String(extra)}`;
        }
      } else {
        line += ` | ${String(extra)}`;
      }
    }

    this.channel.appendLine(line);
  }
}
