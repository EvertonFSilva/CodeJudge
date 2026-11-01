"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptController = void 0;
class PromptController {
    loadUseCase;
    viewUseCase;
    editorAdapter;
    constructor(loadUseCase, viewUseCase, editorAdapter) {
        this.loadUseCase = loadUseCase;
        this.viewUseCase = viewUseCase;
        this.editorAdapter = editorAdapter;
    }
    async handleLoadAll() {
        return this.loadUseCase.execute();
    }
    async handleViewPrompt(request) {
        return this.editorAdapter.withProgress('Carregando prompt...', async () => {
            const res = await this.viewUseCase.execute(request);
            if (res.filePath) {
                await this.editorAdapter.openMarkdownSidePreview(res.filePath);
            }
            return res;
        });
    }
}
exports.PromptController = PromptController;
//# sourceMappingURL=PromptController.js.map