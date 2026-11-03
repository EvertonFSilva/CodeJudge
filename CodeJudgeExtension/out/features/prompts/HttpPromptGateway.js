"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpPromptGateway = void 0;
const BaseHttpGateway_1 = require("../../infrastructure/http/BaseHttpGateway");
class HttpPromptGateway extends BaseHttpGateway_1.BaseHttpGateway {
    constructor(getApiUrl, logger) {
        super(getApiUrl, logger, () => 15000);
    }
    async loadAll() {
        return this.getJson({
            endpoint: '/prompts/all',
            errorMessage: 'Falha ao obter prompts da API'
        });
    }
    async loadSingle(category, promptKey) {
        return this.getJson({
            endpoint: `/prompts/single/${encodeURIComponent(category)}/${encodeURIComponent(promptKey)}`,
            errorMessage: `Prompt '${category}/${promptKey}' nao localizado no servidor`
        });
    }
}
exports.HttpPromptGateway = HttpPromptGateway;
//# sourceMappingURL=HttpPromptGateway.js.map