from Domain.ValueObjects.SourceCode import SourceCode
from Domain.Entities.Results.CompilationCodeResult import CompilationCodeResult

class CompilationCodeService:
    def __init__(self, compilerRegistry=None, errorService=None):
        self.compilerRegistry = compilerRegistry
        self.errorService = errorService

    def compileSource(self, language, code):
        sourceCode = SourceCode(code)
        compiler = self.compilerRegistry.get(language)
        if not compiler:
            return CompilationCodeResult(False, "Compilador não registrado")

        compilationResult = compiler.compile(sourceCode)
        if not compilationResult.isSuccess() and self.errorService:
            errorResult = self.errorService.analyzeCompilationError(
                language, code, compilationResult.getMessage()
            )
            return CompilationCodeResult(
                False,
                errorResult.getMessage(),
                errorResult.getErrorMessage()
            )

        return compilationResult
