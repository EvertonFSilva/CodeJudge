from typing import Optional
from Domain.Reports.AnalysisReport import AnalysisReport
from Application.UseCases.BaseTemplateUseCase import BaseTemplateUseCase

class AnalyzeCodeUseCase(BaseTemplateUseCase):
    def execute(
        self,
        statement: str,
        language: str,
        code: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> AnalysisReport:
        feedback, durationMs = self._runCategoryTemplates(
            category="analysis",
            emptyCategoryMessage="Nenhum template de prompt de análise encontrado no repositório.",
            statement=statement,
            language=language,
            code=code,
            apiKey=apiKey,
            engine=engine,
            model=model
        )
        return AnalysisReport(
            success=True,
            message=feedback,
            feedback=feedback,
            durationMs=durationMs
        )
