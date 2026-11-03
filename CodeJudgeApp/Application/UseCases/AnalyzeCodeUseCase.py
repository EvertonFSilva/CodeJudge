import time
import concurrent.futures
from typing import Optional
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Reports.AnalysisReport import AnalysisReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Factories.EngineFactory import EngineFactory
from Infrastructure.Logging.Logger import Logger

class AnalyzeCodeUseCase:
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

    def execute(
        self,
        statement: str,
        language: str,
        code: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> AnalysisReport:
        startTime = time.time()
        activeEngine = EngineFactory.resolveForRequest(
            config=self.configManager,
            fallbackEngine=self.aiEngine,
            apiKey=apiKey,
            engine=engine,
            model=model
        )

        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Analysis requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Analysis requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code analysis for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory("analysis")
        if templates:
            orderedDocs = list(templates.values())
            isLocalEngine = "ollama" in activeEngine.__class__.__name__.lower() or getattr(activeEngine, "isLocal", False)
            results = []
            if isLocalEngine:
                for idx, doc in enumerate(orderedDocs):
                    try:
                        self.logger.info(f"Processing analysis prompt [{idx + 1}/{len(orderedDocs)}]: '{doc.name}'...")
                        res = self._executePromptTemplate(activeEngine, doc, statement, language, code)
                        if res and res.strip():
                            results.append(res.strip())
                    except Exception as err:
                        self.logger.error(f"Error executing template '{doc.name}': {str(err)}", err)
            else:
                workerCount = min(len(orderedDocs), 4)
                with concurrent.futures.ThreadPoolExecutor(max_workers=workerCount) as executor:
                    futureToDoc = {
                        executor.submit(self._executePromptTemplate, activeEngine, doc, statement, language, code): doc
                        for doc in orderedDocs
                    }
                    for future in futureToDoc:
                        try:
                            res = future.result()
                            if res and res.strip():
                                results.append(res.strip())
                        except Exception as err:
                            doc = futureToDoc[future]
                            self.logger.error(f"Error executing template '{doc.name}': {str(err)}", err)

            feedback = PromptBuilder.normalizeCodeFences("\n\n---\n\n".join(results))
        else:
            feedback = "Nenhum template de prompt de análise encontrado no repositório."

        durationMs = round((time.time() - startTime) * 1000, 2)
        self.logger.info(f"Code analysis completed in {durationMs}ms across {len(templates)} templates.")
        return AnalysisReport(
            success=True,
            message=feedback,
            feedback=feedback,
            durationMs=durationMs
        )
