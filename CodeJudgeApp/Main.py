import logging
from contextlib import asynccontextmanager
import uvicorn
from uvicorn.config import LOGGING_CONFIG
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger
from Infrastructure.Registries.CompilerRegistry import CompilerRegistry
from Infrastructure.Registries.ExecutorRegistry import ExecutorRegistry
from Infrastructure.Repositories.FilePromptRepository import FilePromptRepository
from Infrastructure.Factories.EngineFactory import EngineFactory

from Application.UseCases.DiagnoseErrorUseCase import DiagnoseErrorUseCase
from Application.UseCases.CompileCodeUseCase import CompileCodeUseCase
from Application.UseCases.ExecuteCodeUseCase import ExecuteCodeUseCase
from Application.UseCases.AnalyzeCodeUseCase import AnalyzeCodeUseCase
from Application.UseCases.OptimizeCodeUseCase import OptimizeCodeUseCase
from Application.UseCases.PromptUseCase import PromptUseCase
from Application.UseCases.HealthUseCase import HealthUseCase
from Application.UseCases.GetLanguagesUseCase import GetLanguagesUseCase
from Application.UseCases.GetAiModelsUseCase import GetAiModelsUseCase

from Presentation.Controllers.CompilationController import CompilationController
from Presentation.Controllers.ExecutionController import ExecutionController
from Presentation.Controllers.DiagnosticController import DiagnosticController
from Presentation.Controllers.AnalysisController import AnalysisController
from Presentation.Controllers.OptimizationController import OptimizationController
from Presentation.Controllers.PromptController import PromptController
from Presentation.Controllers.HealthController import HealthController
from Presentation.Controllers.LanguageController import LanguageController
from Presentation.Controllers.AiController import AiController

from Presentation.Routers.HealthRouter import createHealthRouter
from Presentation.Routers.CompilationRouter import createCompilationRouter
from Presentation.Routers.ExecutionRouter import createExecutionRouter
from Presentation.Routers.DiagnosticRouter import createDiagnosticRouter
from Presentation.Routers.AnalysisRouter import createAnalysisRouter
from Presentation.Routers.OptimizationRouter import createOptimizationRouter
from Presentation.Routers.PromptRouter import createPromptRouter
from Presentation.Routers.LanguageRouter import createLanguageRouter
from Presentation.Routers.AiRouter import createAiRouter

from Domain.Exceptions.DomainException import DomainException

class UvicornAccessFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return False

def configureUvicornLogging():
    LOGGING_CONFIG["loggers"]["uvicorn"]["level"] = "WARNING"
    LOGGING_CONFIG["loggers"]["uvicorn.error"]["level"] = "WARNING"
    LOGGING_CONFIG["loggers"]["uvicorn.access"]["level"] = "WARNING"
    LOGGING_CONFIG["loggers"]["uvicorn.access"]["handlers"] = []

    accessLogger = logging.getLogger("uvicorn.access")
    accessLogger.addFilter(UvicornAccessFilter())
    accessLogger.disabled = True
    accessLogger.propagate = False
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)

configureUvicornLogging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    configureUvicornLogging()
    yield

def createApp() -> FastAPI:
    config = ConfigurationManager.get()
    logger = Logger.get()
    logger.info("Initializing CodeJudgeApp backend...")

    app = FastAPI(
        title="CodeJudge Code Assessment API",
        version="2.2.0",
        description="Backend engine for compilation, execution, and AI feedback developed by Everton.",
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainException)
    async def domainExceptionHandler(request: Request, exc: DomainException):
        logger.warning(f"Domain exception intercepted at {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": exc.message}
        )

    @app.exception_handler(Exception)
    async def genericExceptionHandler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}", exc)
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Internal server error: {str(exc)}"}
        )

    compilerRegistry = CompilerRegistry(config)
    executorRegistry = ExecutorRegistry(config)
    promptRepository = FilePromptRepository(config.getTemplatesDirectory())
    aiEngine = EngineFactory.create(config)

    diagnoseErrorUseCase = DiagnoseErrorUseCase(
        promptRepository=promptRepository,
        aiEngine=aiEngine,
        configManager=config
    )

    compileUseCase = CompileCodeUseCase(
        compilerRegistry=compilerRegistry,
        languageRepository=config,
        diagnoseErrorUseCase=diagnoseErrorUseCase,
        configManager=config
    )

    executeUseCase = ExecuteCodeUseCase(
        compileUseCase=compileUseCase,
        executorRegistry=executorRegistry,
        languageRepository=config,
        diagnoseErrorUseCase=diagnoseErrorUseCase
    )

    analyzeUseCase = AnalyzeCodeUseCase(
        aiEngine=aiEngine,
        promptRepository=promptRepository,
        languageRepository=config,
        configManager=config
    )

    optimizeUseCase = OptimizeCodeUseCase(
        aiEngine=aiEngine,
        promptRepository=promptRepository,
        languageRepository=config,
        configManager=config
    )

    promptUseCase = PromptUseCase(
        promptRepository=promptRepository
    )

    healthUseCase = HealthUseCase(
        aiEngine=aiEngine,
        languageRepository=config,
        configManager=config
    )

    getLanguagesUseCase = GetLanguagesUseCase(
        languageRepository=config
    )

    getAiModelsUseCase = GetAiModelsUseCase(
        aiProviderRepository=config
    )

    compilationController = CompilationController(compileUseCase)
    executionController = ExecutionController(executeUseCase)
    diagnosticController = DiagnosticController(diagnoseErrorUseCase)
    analysisController = AnalysisController(analyzeUseCase)
    optimizationController = OptimizationController(optimizeUseCase)
    promptController = PromptController(promptUseCase)
    healthController = HealthController(healthUseCase)
    languageController = LanguageController(getLanguagesUseCase)
    aiController = AiController(getAiModelsUseCase)

    app.include_router(createHealthRouter(healthController))
    app.include_router(createCompilationRouter(compilationController))
    app.include_router(createExecutionRouter(executionController))
    app.include_router(createDiagnosticRouter(diagnosticController))
    app.include_router(createAnalysisRouter(analysisController))
    app.include_router(createOptimizationRouter(optimizationController))
    app.include_router(createPromptRouter(promptController))
    app.include_router(createLanguageRouter(languageController))
    app.include_router(createAiRouter(aiController))

    logger.info("Application routes registered successfully.")
    return app

app = createApp()

if __name__ == "__main__":
    uvicorn.run("Main:app", host="0.0.0.0", port=8000, reload=True, access_log=False, log_level="warning", log_config=LOGGING_CONFIG)
