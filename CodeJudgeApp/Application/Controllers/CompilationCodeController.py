class CompilationCodeController:
    def __init__(self, compilationService=None):
        self.compilationService = compilationService

    def compile(self, language, code):
        return self.compilationService.compileSource(language, code)
