import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './AppConfig';

export class ConfigLoader {
  private static cachedConfig: AppConfig | null = null;

  public static load(extensionPath: string): AppConfig {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const defaultFilePath = path.join(extensionPath, 'configuration.json');
    let baseConfig: AppConfig;

    try {
      const fileData = fs.readFileSync(defaultFilePath, 'utf8');
      baseConfig = JSON.parse(fileData);
    } catch {
      baseConfig = {
        api: {
          baseUrl: 'http://localhost:8000',
          timeoutSeconds: 300
        }
      };
    }

    const vsConfig = vscode.workspace.getConfiguration('codejudge');
    const customApiUrl = vsConfig.get<string>('apiUrl');
    const customTimeout = vsConfig.get<number>('requestTimeoutSeconds');

    if (customApiUrl && customApiUrl.trim() !== '') {
      baseConfig.api.baseUrl = customApiUrl.trim().replace(/\/+$/, '');
    }

    if (customTimeout && customTimeout > 0) {
      baseConfig.api.timeoutSeconds = customTimeout;
    }

    this.cachedConfig = baseConfig;
    return baseConfig;
  }

  public static reset(): void {
    this.cachedConfig = null;
  }
}
