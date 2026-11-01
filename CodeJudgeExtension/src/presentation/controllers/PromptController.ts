import { LoadPromptsUseCase } from '../../features/prompts/LoadPromptsUseCase';
import { ViewPromptUseCase } from '../../features/prompts/ViewPromptUseCase';
import { IVsCodeEditorAdapter } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { LoadPromptsResult, ViewPromptRequest, ViewPromptResult } from '../../features/prompts/PromptDTO';

export class PromptController {
  constructor(
    private readonly loadUseCase: LoadPromptsUseCase,
    private readonly viewUseCase: ViewPromptUseCase,
    private readonly editorAdapter: IVsCodeEditorAdapter
  ) {}

  public async handleLoadAll(): Promise<LoadPromptsResult> {
    return this.loadUseCase.execute();
  }

  public async handleViewPrompt(request: ViewPromptRequest): Promise<ViewPromptResult> {
    return this.editorAdapter.withProgress('Carregando prompt...', async () => {
      const res = await this.viewUseCase.execute(request);
      if (res.filePath) {
        await this.editorAdapter.openMarkdownSidePreview(res.filePath);
      }
      return res;
    });
  }
}
