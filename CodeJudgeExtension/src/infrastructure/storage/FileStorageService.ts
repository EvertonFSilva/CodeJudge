import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IFileStorageService } from './IFileStorageService';

export class FileStorageService implements IFileStorageService {
  public saveTemporaryMarkdown(fileName: string, content: string): string {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, content.trim(), 'utf8');
    return filePath;
  }

  public async readText(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf8');
  }

  public exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
