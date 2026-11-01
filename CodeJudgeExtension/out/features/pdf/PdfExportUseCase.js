"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportUseCase = void 0;
const fs = __importStar(require("fs"));
class PdfExportUseCase {
    pdfGenerator;
    editorAdapter;
    logger;
    constructor(pdfGenerator, editorAdapter, logger) {
        this.pdfGenerator = pdfGenerator;
        this.editorAdapter = editorAdapter;
        this.logger = logger;
    }
    async execute(base64OrPath) {
        let cleanText = base64OrPath;
        if (fs.existsSync(base64OrPath)) {
            try {
                cleanText = fs.readFileSync(base64OrPath, 'utf8');
            }
            catch { }
        }
        else {
            try {
                const decoded = Buffer.from(base64OrPath, 'base64').toString('utf8');
                if (!decoded.includes('\uFFFD')) {
                    cleanText = decoded;
                }
            }
            catch { }
        }
        const defaultName = `codejudge_relatorio_${Date.now()}.pdf`;
        const destination = await this.editorAdapter.promptSavePath(defaultName, 'Documento PDF (*.pdf)', 'pdf');
        if (!destination) {
            this.logger.debug('Exportacao de PDF cancelada pelo usuario.');
            return undefined;
        }
        this.logger.info(`Gerando PDF em: ${destination}`);
        await this.editorAdapter.withProgress('Exportando relatorio em PDF...', async () => {
            await this.pdfGenerator.generate(destination, cleanText, 'CodeJudge - Relatorio Tecnico');
        });
        await this.editorAdapter.openExternal(destination);
        const action = await this.editorAdapter.showActionInfo('PDF exportado com sucesso!', 'Mostrar na Pasta', 'Abrir Novamente');
        if (action === 'Mostrar na Pasta') {
            await this.editorAdapter.revealInOS(destination);
        }
        else if (action === 'Abrir Novamente') {
            await this.editorAdapter.openExternal(destination);
        }
        return destination;
    }
}
exports.PdfExportUseCase = PdfExportUseCase;
//# sourceMappingURL=PdfExportUseCase.js.map