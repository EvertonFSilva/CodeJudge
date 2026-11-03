import time
import concurrent.futures
from typing import Optional, Tuple
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Factories.EngineFactory import EngineFactory
from Infrastructure.Logging.Logger import Logger

class BaseTemplateUseCase:
    def __init__(
        self,
        aiEngine: IAiEngine,
        promptRepository: IPromptRepository,
        languageRepository: ILanguageRepository,
        configManager: Optional[ConfigurationManager] = None
    ):
        self.aiEngine = aiEngine
        self.promptRepository = promptRepository
        self.languageRepository = languageRepository
        self.configManager = configManager or ConfigurationManager.get()
        self.logger = Logger.get()

    def _executePromptTemplate(
        self,
        activeEngine: IAiEngine,
        doc,
        statement: str,
        language: str,
        code: str
    ) -> str:
        prompt = (
            PromptBuilder(doc.content.strip())
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )
        return activeEngine.complete(prompt)

    def _runCategoryTemplates(
        self,
        category: str,
        emptyCategoryMessage: str,
        statement: str,
        language: str,
        code: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> Tuple[str, float]:
        startTime = time.time()
        activeEngine = EngineFactory.resolveForRequest(
            config=self.configManager,
            fallbackEngine=self.aiEngine,
            apiKey=apiKey,
            engine=engine,
            model=model
        )

        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"{category.capitalize()} requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning(f"{category.capitalize()} requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code {category} for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory(category)
        if templates:
            orderedDocs = list(templates.values())
            isLocal = activeEngine.isLocalEngine() or getattr(activeEngine, "isLocal", False)
            results = []
            if isLocal:
                for idx, doc in enumerate(orderedDocs):
                    try:
                        self.logger.info(f"Processing {category} prompt [{idx + 1}/{len(orderedDocs)}]: '{doc.name}'...")
                        res = self._executePromptTemplate(activeEngine, doc, statement, language, code)
                        if res and res.strip():
                            results.append(res.strip())
                    except Exception as err:
                        self.logger.error(f"Error executing template '{doc.name}': {str(err)}", err)
            else:
                workerCount = min(len(orderedDocs), 4)
                with concurrent.futures.ThreadPoolExecutor(max_workers=workerCount) as executor:
                    futures = [
                        (doc, executor.submit(self._executePromptTemplate, activeEngine, doc, statement, language, code))
                        for doc in orderedDocs
                    ]
                    for doc, future in futures:
                        try:
                            res = future.result()
                            if res and res.strip():
                                results.append(res.strip())
                        except Exception as err:
                            self.logger.error(f"Error executing template '{doc.name}': {str(err)}", err)

            combinedOutput = PromptBuilder.normalizeCodeFences("\n\n---\n\n".join(results))
        else:
            combinedOutput = emptyCategoryMessage

        durationMs = round((time.time() - startTime) * 1000, 2)
        self.logger.info(f"Code {category} completed in {durationMs}ms across {len(templates)} templates.")
        return combinedOutput, durationMs
