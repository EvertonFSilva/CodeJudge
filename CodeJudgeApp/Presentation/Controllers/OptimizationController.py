from Application.UseCases.OptimizeCodeUseCase import OptimizeCodeUseCase
from Presentation.Schemas.Requests.OptimizationRequest import OptimizationRequest
from Presentation.Schemas.Responses.OptimizationResponse import OptimizationResponse

class OptimizationController:
    def __init__(self, optimizeCodeUseCase: OptimizeCodeUseCase):
        self.optimizeCodeUseCase = optimizeCodeUseCase

    def optimize(self, request: OptimizationRequest) -> OptimizationResponse:
        report = self.optimizeCodeUseCase.execute(
            statement=request.statement or "",
            language=request.language,
            code=request.code,
            apiKey=request.apiKey,
            engine=request.engine,
            model=request.model
        )
        return OptimizationResponse(
            success=report.success,
            message=report.message,
            recommendations=report.recommendations,
            durationMs=report.durationMs
        )
