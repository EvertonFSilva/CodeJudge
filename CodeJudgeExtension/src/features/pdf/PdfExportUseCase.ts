import { IPdfGenerator } from './IPdfGenerator';
import { IVsCodeEditorAdapter } from '../../infrastructure/vscode/IVsCodeEditorAdapter';
import { ILogger } from '../../core/logger/ILogger';
import * as fs from 'fs';

export class PdfExportUseCase {
  constructor(
    private readonly pdfGenerator: IPdfGenerator,
    private readonly editorAdapter: IVsCodeEditorAdapter,
    private readonly logger: ILogger
  ) {}

  public async execute(base64OrPath: string): Promise<string | undefined> {
    let cleanText = base64OrPath;

    if (fs.existsSync(base64OrPath)) {
      try {
        cleanText = fs.readFileSync(base64OrPath, 'utf8');
      } catch {}
    } else {
      try {
        const decoded = Buffer.from(base64OrPath, 'base64').toString('utf8');
        if (!decoded.includes('\uFFFD')) {
          cleanText = decoded;
        }
      } catch {}
    }

    const defaultName = `codejudge_relatorio_${Date.now()}.pdf`;
    const destination = await this.editorAdapter.promptSavePath(
      defaultName,
      'Documento PDF (*.pdf)',
      'pdf'
    );

    if (!destination) {
      this.logger.debug('Exportacao de PDF cancelada pelo usuario.');
      return undefined;
    }

    this.logger.info(`Gerando PDF em: ${destination}`);

    await this.editorAdapter.withProgress('Exportando relatorio em PDF...', async () => {
      await this.pdfGenerator.generate(
        destination,
        cleanText,
        'CodeJudge - Relatorio Tecnico'
      );
    });

    await this.editorAdapter.openExternal(destination);

    const action = await this.editorAdapter.showActionInfo(
      'PDF exportado com sucesso!',
      'Mostrar na Pasta',
      'Abrir Novamente'
    );
    if (action === 'Mostrar na Pasta') {
      await this.editorAdapter.revealInOS(destination);
    } else if (action === 'Abrir Novamente') {
      await this.editorAdapter.openExternal(destination);
    }

    return destination;
  }
}
