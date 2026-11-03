import os
import shutil
from typing import Optional
from Domain.Contracts.ICompilerRegistry import ICompilerRegistry
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.SourceCode import SourceCode
from Domain.Reports.CompilationReport import CompilationReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Factories.EngineFactory import EngineFactory
from Infrastructure.Logging.Logger import Logger
from Application.UseCases.DiagnoseErrorUseCase import DiagnoseErrorUseCase

class CompileCodeUseCase:
    def __init__(
        self,
        compilerRegistry: ICompilerRegistry,
        languageRepository: ILanguageRepository,
        diagnoseErrorUseCase: DiagnoseErrorUseCase,
        configManager: Optional[ConfigurationManager] = None
    ):
        self.compilerRegistry = compilerRegistry
        self.languageRepository = languageRepository
        self.diagnoseErrorUseCase = diagnoseErrorUseCase
        self.configManager = configManager or ConfigurationManager.get()
        self.logger = Logger.get()

    def execute(
        self,
        statement: str,
        language: str,
        code: str,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None,
        disposeWorkspace: bool = False
    ) -> CompilationReport:
        EngineFactory.resolveForRequest(
            config=self.configManager,
            fallbackEngine=self.diagnoseErrorUseCase.aiEngine,
            apiKey=apiKey,
            engine=engine,
            model=model
        )

        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Compilation requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Compilation requested for empty source code.")
            raise EmptySourceCodeException()

        compiler = self.compilerRegistry.getCompiler(language)
        if not compiler:
            raise UnsupportedLanguageException(language)

        langEntity = self.languageRepository.getLanguage(language)
        source = SourceCode(
            code=code,
            language=language,
            extension=langEntity.sourceExtension if langEntity else f".{language}"
        )

        report = compiler.compile(source)

        try:
            if not report.success:
                feedback = self.diagnoseErrorUseCase.diagnoseCompilationError(
                    statement=statement,
                    language=language,
                    code=code,
                    logs=report.logs,
                    apiKey=apiKey,
                    engine=engine,
                    model=model
                )
                if feedback:
                    report.feedback = feedback
                    report.message = f"{report.message}\n\nFeedback:\n{feedback}"
            return report
        finally:
            if disposeWorkspace and report.workspaceDirectory and os.path.isdir(report.workspaceDirectory):
                shutil.rmtree(report.workspaceDirectory, ignore_errors=True)
