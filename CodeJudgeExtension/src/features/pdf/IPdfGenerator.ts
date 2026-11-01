export interface IPdfGenerator {
  generate(targetPath: string, markdownContent: string, title?: string): Promise<void>;
}
