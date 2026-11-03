from Application.UseCases.AnalyzeCodeUseCase import AnalyzeCodeUseCase
from Presentation.Schemas.Requests.AnalysisRequest import AnalysisRequest
from Presentation.Schemas.Responses.AnalysisResponse import AnalysisResponse

class AnalysisController:
    def __init__(self, analyzeCodeUseCase: AnalyzeCodeUseCase):
        self.analyzeCodeUseCase = analyzeCodeUseCase

    def analyze(self, request: AnalysisRequest) -> AnalysisResponse:
        report = self.analyzeCodeUseCase.execute(
            statement=request.statement or "",
            language=request.language,
            code=request.code,
            apiKey=request.apiKey,
            engine=request.engine,
            model=request.model
        )
        return AnalysisResponse(
            success=report.success,
            message=report.message,
            feedback=report.feedback,
            durationMs=report.durationMs
        )
