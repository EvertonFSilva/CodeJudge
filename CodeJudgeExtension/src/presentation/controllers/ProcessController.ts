import { ProcessUseCase } from '../../features/process/ProcessUseCase';
import { IVsCodeEditorAdapter } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { RunProcessRequest, ProcessResult, StageProgress } from '../../features/process/ProcessDTO';

export class ProcessController {
  constructor(
    private readonly processUseCase: ProcessUseCase,
    private readonly editorAdapter: IVsCodeEditorAdapter
  ) {}

  public async handleRun(
    request: RunProcessRequest,
    onProgress: (progress: StageProgress) => void
  ): Promise<ProcessResult> {
    return this.editorAdapter.withProgress('Processando codigo no CodeJudge...', async () => {
      const result = await this.processUseCase.execute(request, onProgress);

      if (result.stoppedEarly) {
        this.editorAdapter.showWarning('Compilacao com erro sintatico. Consulte o relatorio gerado.');
      } else if (result.allSucceeded) {
        this.editorAdapter.showInfo('Processamento finalizado com sucesso.');
      } else {
        this.editorAdapter.showInfo('Processamento finalizado com observacoes.');
      }

      return result;
    });
  }
}
