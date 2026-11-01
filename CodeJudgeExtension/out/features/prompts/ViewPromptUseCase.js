"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewPromptUseCase = void 0;
class ViewPromptUseCase {
    gateway;
    storageService;
    logger;
    constructor(gateway, storageService, logger) {
        this.gateway = gateway;
        this.storageService = storageService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.info(`Abrindo prompt: ${request.category}/${request.promptKey}`);
            const data = await this.gateway.loadSingle(request.category, request.promptKey);
            let content = '';
            let title = `${request.category} - ${request.promptKey}`;
            if (data && typeof data === 'object') {
                content = data.prompt || data.content || JSON.stringify(data, null, 2);
                if (data.metadata?.name) {
                    title = data.metadata.name;
                }
            }
            else if (typeof data === 'string') {
                content = data;
            }
            const formatted = [
                `# Prompt: ${title}`,
                `> **Categoria:** \`${request.category}\` | **Identificador:** \`${request.promptKey}\``,
                `\n---\n`,
                content.trim()
            ].join('\n');
            const safeCategory = request.category.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const safeKey = request.promptKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            const fileName = `codejudge_prompt_${safeCategory}_${safeKey}_${timestamp}.md`;
            const filePath = this.storageService.saveTemporaryMarkdown(fileName, formatted);
            return {
                filePath,
                content: content.trim(),
                category: request.category,
                promptKey: request.promptKey
            };
        }
        catch (err) {
            this.logger.error(`Erro ao visualizar prompt ${request.category}/${request.promptKey}`, err);
            throw err;
        }
    }
}
exports.ViewPromptUseCase = ViewPromptUseCase;
//# sourceMappingURL=ViewPromptUseCase.js.map