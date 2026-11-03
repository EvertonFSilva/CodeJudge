from typing import List

class DomainException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class UnsupportedLanguageException(DomainException):
    def __init__(self, language: str):
        super().__init__(f"Programming language '{language}' is not supported. Check configured languages in Configuration.json.")

class EmptySourceCodeException(DomainException):
    def __init__(self):
        super().__init__("The provided source code is empty or whitespace.")

class ExecutionTimeoutException(DomainException):
    def __init__(self, timeoutSeconds: int):
        super().__init__(f"Execution timed out after {timeoutSeconds} seconds.")

class AiEngineException(DomainException):
    def __init__(self, message: str):
        super().__init__(f"Communication error with AI engine: {message}")

class MissingUserApiKeyException(DomainException):
    def __init__(self):
        super().__init__(
            "A chave de API ('apiKey') é obrigatória nos parâmetros da requisição quando 'isUserKeyRequired' está ativo no servidor."
        )

class UnsupportedAiEngineException(DomainException):
    def __init__(self, engine: str, supportedEngines: List[str]):
        supportedList = ", ".join(supportedEngines) if supportedEngines else "none"
        super().__init__(
            f"O provedor de IA '{engine}' não é suportado pelo servidor. Provedores suportados: [{supportedList}]."
        )

class UnsupportedAiModelException(DomainException):
    def __init__(self, model: str, engine: str, supportedModels: List[str]):
        supportedList = ", ".join(supportedModels) if supportedModels else "none"
        super().__init__(
            f"O modelo de IA '{model}' não é suportado para o provedor '{engine}'. Modelos suportados: [{supportedList}]."
        )
