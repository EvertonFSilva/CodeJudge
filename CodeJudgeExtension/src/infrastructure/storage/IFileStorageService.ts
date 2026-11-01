export interface IFileStorageService {
  saveTemporaryMarkdown(fileName: string, content: string): string;
  readText(filePath: string): Promise<string>;
  exists(filePath: string): boolean;
}
