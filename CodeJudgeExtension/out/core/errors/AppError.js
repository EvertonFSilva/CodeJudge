"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerConnectionError = exports.NoActiveEditorError = exports.EmptyCodeError = exports.UnsupportedLanguageError = exports.AppError = void 0;
class AppError extends Error {
    code;
    constructor(message, code = 'APP_ERROR') {
        super(message);
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class UnsupportedLanguageError extends AppError {
    constructor(language) {
        super(`A linguagem '${language}' não possui suporte configurado.`, 'UNSUPPORTED_LANGUAGE');
        this.name = 'UnsupportedLanguageError';
    }
}
exports.UnsupportedLanguageError = UnsupportedLanguageError;
class EmptyCodeError extends AppError {
    constructor() {
        super('O arquivo ativo no editor não possui conteúdo de código.', 'EMPTY_CODE');
        this.name = 'EmptyCodeError';
    }
}
exports.EmptyCodeError = EmptyCodeError;
class NoActiveEditorError extends AppError {
    constructor() {
        super('Nenhum arquivo ativo aberto no editor.', 'NO_ACTIVE_EDITOR');
        this.name = 'NoActiveEditorError';
    }
}
exports.NoActiveEditorError = NoActiveEditorError;
class ServerConnectionError extends AppError {
    constructor(details) {
        super(`Falha de comunicação com o servidor CodeJudge.${details ? ` Detalhes: ${details}` : ''}`, 'SERVER_ERROR');
        this.name = 'ServerConnectionError';
    }
}
exports.ServerConnectionError = ServerConnectionError;
//# sourceMappingURL=AppError.js.map