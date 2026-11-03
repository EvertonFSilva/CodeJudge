from typing import Optional
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Factories.EngineFactory import EngineFactory
from Infrastructure.Logging.Logger import Logger

class DiagnoseErrorUseCase:
    def __init__(
        self,
        promptRepository: IPromptRepository,
        aiEngine: IAiEngine,
        configManager: Optional[ConfigurationManager] = None
    ):
        self.promptRepository = promptRepository
        self.aiEngine = aiEngine
        self.configManager = configManager or ConfigurationManager.get()
        self.logger = Logger.get()

    def _diagnoseWithTemplate(
        self,
        templateKey: str,
        sectionTitle: str,
        logLabel: str,
        statement: str,
        language: str,
        code: str,
        details: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        activeEngine = EngineFactory.resolveForRequest(
            config=self.configManager,
            fallbackEngine=self.aiEngine,
            apiKey=apiKey,
            engine=engine,
            model=model
        )
        self.logger.info(f"Generating diagnostic feedback for {language.upper()} {logLabel}.")
        document = self.promptRepository.getTemplate("error", templateKey)
        if not document or not document.content.strip():
            self.logger.error(f"Prompt template 'error/{templateKey}' not found in repository.")
            return f"Diagnóstico indisponível: template 'error/{templateKey}' não foi localizado no diretório de templates."

        prompt = (
            PromptBuilder(document.content.strip())
            .withLabeledContext("Enunciado da Tarefa", statement or "Não informado")
            .withLabeledContext("Linguagem de Programação", language.upper())
            .withCodeBlock(language, code)
            .withSection(sectionTitle, details)
            .build()
        )
        return PromptBuilder.normalizeCodeFences(activeEngine.complete(prompt))

    def diagnoseCompilationError(
        self,
        statement: str,
        language: str,
        code: str,
        logs: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        return self._diagnoseWithTemplate(
            templateKey="compilation",
            sectionTitle="Mensagem do Compilador",
            logLabel="compilation error",
            statement=statement,
            language=language,
            code=code,
            details=logs,
            apiKey=apiKey,
            engine=engine,
            model=model
        )

    def diagnoseExecutionError(
        self,
        statement: str,
        language: str,
        code: str,
        errorMessage: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        return self._diagnoseWithTemplate(
            templateKey="execution",
            sectionTitle="Erro em Tempo de Execução",
            logLabel="execution failure",
            statement=statement,
            language=language,
            code=code,
            details=errorMessage,
            apiKey=apiKey,
            engine=engine,
            model=model
        )

    def diagnoseLogicMismatch(
        self,
        statement: str,
        language: str,
        code: str,
        mismatchDetails: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        return self._diagnoseWithTemplate(
            templateKey="logicmismatch",
            sectionTitle="Divergência nos Casos de Teste",
            logLabel="logic mismatch",
            statement=statement,
            language=language,
            code=code,
            details=mismatchDetails,
            apiKey=apiKey,
            engine=engine,
            model=model
        )
