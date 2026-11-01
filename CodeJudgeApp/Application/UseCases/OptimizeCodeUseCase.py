import time
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Reports.OptimizationReport import OptimizationReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Logging.Logger import Logger

class OptimizeCodeUseCase:
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

    def execute(self, statement: str, language: str, code: str) -> OptimizationReport:
        startTime = time.time()
        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Optimization requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Optimization requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code optimization for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory("optimization")
        baseGuideline = next((item.content for item in templates.values()), (
            "Você é um engenheiro sênior especialista em otimização de desempenho e eficiência algorítmica.\n"
            "Analise a complexidade assintótica de tempo e espaço, uso de memória e padrões de computação.\n"
            "Apresente uma nota de 0 a 10 e elabore um plano concreto de otimização detalhando ganhos esperados."
        ))

        prompt = (
            PromptBuilder(baseGuideline)
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )

        recommendations = self.aiEngine.complete(prompt)
        durationMs = round((time.time() - startTime) * 1000, 2)

        self.logger.info(f"Code optimization completed in {durationMs}ms.")
        return OptimizationReport(
            success=True,
            message=recommendations,
            recommendations=recommendations,
            durationMs=durationMs
        )
