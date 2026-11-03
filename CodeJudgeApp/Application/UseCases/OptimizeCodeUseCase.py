from typing import Optional
from Domain.Reports.OptimizationReport import OptimizationReport
from Application.UseCases.BaseTemplateUseCase import BaseTemplateUseCase

class OptimizeCodeUseCase(BaseTemplateUseCase):
    def execute(
        self,
        statement: str,
        language: str,
        code: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> OptimizationReport:
        recommendations, durationMs = self._runCategoryTemplates(
            category="optimization",
            emptyCategoryMessage="Nenhum template de prompt de otimização encontrado no repositório.",
            statement=statement,
            language=language,
            code=code,
            apiKey=apiKey,
            engine=engine,
            model=model
        )
        return OptimizationReport(
            success=True,
            message=recommendations,
            recommendations=recommendations,
            durationMs=durationMs
        )
