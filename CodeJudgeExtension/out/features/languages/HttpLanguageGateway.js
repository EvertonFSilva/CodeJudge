"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLanguageGateway = void 0;
const BaseHttpGateway_1 = require("../../infrastructure/http/BaseHttpGateway");
class HttpLanguageGateway extends BaseHttpGateway_1.BaseHttpGateway {
    constructor(getApiUrl, logger) {
        super(getApiUrl, logger, () => 8000);
    }
    async fetchSupportedLanguages() {
        const data = await this.getJson({
            endpoint: '/languages',
            errorMessage: 'Falha ao obter linguagens suportadas da API'
        });
        return (data?.languages || []);
    }
}
exports.HttpLanguageGateway = HttpLanguageGateway;
//# sourceMappingURL=HttpLanguageGateway.js.map