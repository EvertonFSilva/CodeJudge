import time
import concurrent.futures
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

    def _executePromptTemplate(self, doc, statement: str, language: str, code: str) -> str:
        prompt = (
            PromptBuilder(doc.content.strip())
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )
        return self.aiEngine.complete(prompt)

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
        if templates:
            orderedDocs = list(templates.values())
            workerCount = min(len(orderedDocs), 4)
            with concurrent.futures.ThreadPoolExecutor(max_workers=workerCount) as executor:
                futureToDoc = {
                    executor.submit(self._executePromptTemplate, doc, statement, language, code): doc
                    for doc in orderedDocs
                }
                results = []
                for future in futureToDoc:
                    try:
                        res = future.result()
                        if res and res.strip():
                            results.append(res.strip())
                    except Exception as err:
                        doc = futureToDoc[future]
                        self.logger.error(f"Error executing template '{doc.name}': {str(err)}", err)

            recommendations = "\n\n---\n\n".join(results)
        else:
            recommendations = "Nenhum template de prompt de otimização encontrado no repositório."

        durationMs = round((time.time() - startTime) * 1000, 2)
        self.logger.info(f"Code optimization completed in {durationMs}ms across {len(templates)} templates.")
        return OptimizationReport(
            success=True,
            message=recommendations,
            recommendations=recommendations,
            durationMs=durationMs
        )
