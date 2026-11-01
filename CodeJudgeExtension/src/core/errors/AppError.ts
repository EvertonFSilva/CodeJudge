export class AppError extends Error {
  constructor(message: string, public readonly code: string = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
  }
}

export class UnsupportedLanguageError extends AppError {
  constructor(language: string) {
    super(`A linguagem '${language}' não possui suporte configurado.`, 'UNSUPPORTED_LANGUAGE');
    this.name = 'UnsupportedLanguageError';
  }
}

export class EmptyCodeError extends AppError {
  constructor() {
    super('O arquivo ativo no editor não possui conteúdo de código.', 'EMPTY_CODE');
    this.name = 'EmptyCodeError';
  }
}

export class NoActiveEditorError extends AppError {
  constructor() {
    super('Nenhum arquivo ativo aberto no editor.', 'NO_ACTIVE_EDITOR');
    this.name = 'NoActiveEditorError';
  }
}

export class ServerConnectionError extends AppError {
  constructor(details?: string) {
    super(`Falha de comunicação com o servidor CodeJudge.${details ? ` Detalhes: ${details}` : ''}`, 'SERVER_ERROR');
    this.name = 'ServerConnectionError';
  }
}
