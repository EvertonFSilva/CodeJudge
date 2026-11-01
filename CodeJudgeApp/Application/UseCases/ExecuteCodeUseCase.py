import os
import shutil
from typing import List, Optional
from Domain.Contracts.IExecutorRegistry import IExecutorRegistry
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.TestScenario import TestScenario
from Domain.Reports.ExecutionReport import ExecutionReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Logging.Logger import Logger
from Application.UseCases.CompileCodeUseCase import CompileCodeUseCase
from Application.UseCases.DiagnoseErrorUseCase import DiagnoseErrorUseCase

class ExecuteCodeUseCase:
    def __init__(
        self,
        compileUseCase: CompileCodeUseCase,
        executorRegistry: IExecutorRegistry,
        languageRepository: ILanguageRepository,
        diagnoseErrorUseCase: DiagnoseErrorUseCase
    ):
        self.compileUseCase = compileUseCase
        self.executorRegistry = executorRegistry
        self.languageRepository = languageRepository
        self.diagnoseErrorUseCase = diagnoseErrorUseCase
        self.logger = Logger.get()

    def execute(
        self,
        statement: str,
        language: str,
        code: str,
        scenarios: Optional[List[TestScenario]] = None
    ) -> ExecutionReport:
        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Execution requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Execution requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating execution pipeline with prerequisite compilation for '{language}'.")
        buildReport = self.compileUseCase.execute(
            statement=statement,
            language=language,
            code=code
        )

        workspaceDirectory = os.path.dirname(buildReport.binaryPath) if buildReport.binaryPath else None

        if not buildReport.success:
            if workspaceDirectory and os.path.isdir(workspaceDirectory):
                shutil.rmtree(workspaceDirectory, ignore_errors=True)
            return ExecutionReport(
                success=False,
                message=f"Compilation failure: {buildReport.message}",
                inputs=[],
                outputs=[],
                rate=None,
                details={"error": "CompilationFailed", "logs": buildReport.logs}
            )

        executor = self.executorRegistry.getExecutor(language)
        if not executor:
            if workspaceDirectory and os.path.isdir(workspaceDirectory):
                shutil.rmtree(workspaceDirectory, ignore_errors=True)
            raise UnsupportedLanguageException(language)

        timeout = self.languageRepository.getExecutionTimeout()

        try:
            executionReport = executor.execute(
                targetPath=buildReport.binaryPath,
                scenarios=scenarios,
                timeoutSeconds=timeout
            )

            if not executionReport.success and (not scenarios or len(scenarios) == 0):
                feedback = self.diagnoseErrorUseCase.diagnoseExecutionError(
                    statement=statement,
                    language=language,
                    code=code,
                    errorMessage=executionReport.message
                )
                if feedback:
                    executionReport.message = f"{executionReport.message}\n\nFeedback:\n{feedback}"

            return executionReport

        finally:
            if workspaceDirectory and os.path.isdir(workspaceDirectory):
                shutil.rmtree(workspaceDirectory, ignore_errors=True)
                self.logger.debug(f"Temporary workspace '{workspaceDirectory}' safely disposed.")
