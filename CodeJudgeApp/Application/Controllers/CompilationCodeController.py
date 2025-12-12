class CompilationCodeController:
    def __init__(self, compilationService=None):
        self.compilationService = compilationService

    def compile(self, statement, language, code):
        return self.compilationService.compileSource(statement, language, code)
