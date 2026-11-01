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
