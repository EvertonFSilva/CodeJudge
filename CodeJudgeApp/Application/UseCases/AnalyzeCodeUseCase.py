import time
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Reports.AnalysisReport import AnalysisReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Logging.Logger import Logger

class AnalyzeCodeUseCase:
    def __init__(
        self,
        aiEngine: IAiEngine,
        promptRepository: IPromptRepository,
        languageRepository: ILanguageRepository
    ):
        self.aiEngine = aiEngine
        self.promptRepository = promptRepository
        self.languageRepository = languageRepository
        self.logger = Logger.get()

    def execute(self, statement: str, language: str, code: str) -> AnalysisReport:
        startTime = time.time()
        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Analysis requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Analysis requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code analysis for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory("analysis")
        baseGuideline = next((item.content for item in templates.values()), (
            "Você é um avaliador sênior de código e boas práticas com foco em precisão técnica e rigor acadêmico.\n"
            "Avalie o código considerando legibilidade, manutenibilidade, conformidade com padrões idiomáticos e segurança.\n"
            "Apresente uma nota de 0 a 10 e forneça um diagnóstico técnico aprofundado com justificativas claras."
        ))

        prompt = (
            PromptBuilder(baseGuideline)
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )

        feedback = self.aiEngine.complete(prompt)
        durationMs = round((time.time() - startTime) * 1000, 2)

        self.logger.info(f"Code analysis completed in {durationMs}ms.")
        return AnalysisReport(
            success=True,
            message=feedback,
            feedback=feedback,
            durationMs=durationMs
        )
