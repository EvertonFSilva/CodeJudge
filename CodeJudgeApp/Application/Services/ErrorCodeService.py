from Domain.Entities.Results.ErrorCodeResult import ErrorCodeResult

class ErrorCodeService:
    def __init__(self, engineRegistry=None, promptManager=None):
        self.engineRegistry = engineRegistry
        self.promptManager = promptManager
        self.errorHandlers = {
            "compilation": self.analyzeCompilationError,
            "execution": self.analyzeExecutionError
        }

    def analyzeCompilationError(self, language, code, errorMessage):
        engine = self.engineRegistry.get(language) or self.engineRegistry.getDefault()
        prompt = self.promptManager.getPrompt("error", "compilation") + "\n" + language + "\n" + code + "\nErro:\n" + errorMessage
        responseText = engine.complete(prompt, {})
        return ErrorCodeResult(True, responseText, errorMessage)

    def analyzeExecutionError(self, language, code, errorMessage):
        engine = self.engineRegistry.get(language) or self.engineRegistry.getDefault()
        prompt = self.promptManager.getPrompt("error", "execution") + "\n" + language + "\n" + code + "\nErro:\n" + errorMessage
        responseText = engine.complete(prompt, {})
        return ErrorCodeResult(True, responseText, errorMessage)

    def generateError(self, language, code, errorMessage, errorType):
        handler = self.errorHandlers.get(errorType.lower())
        if handler:
            return handler(language, code, errorMessage)
        return ErrorCodeResult(False, "Tipo de erro desconhecido", errorMessage)