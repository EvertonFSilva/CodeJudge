from Application.UseCases.CompileCodeUseCase import CompileCodeUseCase
from Presentation.Schemas.Requests.CompilationRequest import CompilationRequest
from Presentation.Schemas.Responses.CompilationResponse import CompilationResponse

class CompilationController:
    def __init__(self, compileCodeUseCase: CompileCodeUseCase):
        self.compileCodeUseCase = compileCodeUseCase

    def compile(self, request: CompilationRequest) -> CompilationResponse:
        report = self.compileCodeUseCase.execute(
            statement=request.statement or "",
            language=request.language,
            code=request.code,
            apiKey=request.apiKey,
            engine=request.engine,
            model=request.model
        )
        return CompilationResponse(
            success=report.success,
            message=report.message,
            sourcePath=report.binaryPath,
            logs=report.logs,
            durationMs=report.durationMs
        )
