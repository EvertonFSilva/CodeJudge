class ErrorCodeController:
    def __init__(self, errorCodeService=None):
        self.errorCodeService = errorCodeService

    def analyzeError(self, language, code, errorMessage, errorType):
        return self.errorCodeService.generateErrorAnalysis(language, code, errorMessage, errorType)