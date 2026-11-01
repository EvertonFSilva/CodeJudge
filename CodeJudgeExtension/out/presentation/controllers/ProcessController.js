"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessController = void 0;
class ProcessController {
    processUseCase;
    editorAdapter;
    constructor(processUseCase, editorAdapter) {
        this.processUseCase = processUseCase;
        this.editorAdapter = editorAdapter;
    }
    async handleRun(request, onProgress) {
        return this.editorAdapter.withProgress('Processando codigo no CodeJudge...', async () => {
            const result = await this.processUseCase.execute(request, onProgress);
            if (result.stoppedEarly) {
                this.editorAdapter.showWarning('Compilacao com erro sintatico. Consulte o relatorio gerado.');
            }
            else if (result.allSucceeded) {
                this.editorAdapter.showInfo('Processamento finalizado com sucesso.');
            }
            else {
                this.editorAdapter.showInfo('Processamento finalizado com observacoes.');
            }
            return result;
        });
    }
}
exports.ProcessController = ProcessController;
//# sourceMappingURL=ProcessController.js.map