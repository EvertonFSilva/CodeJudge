import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Core.Config.ConfigurationManager import ConfigurationManager
from Utils.Registry.EngineRegistry import EngineRegistry
from Utils.Registry.CompilerRegistry import CompilerRegistry
from Utils.Registry.ExecutorRegistry import ExecutorRegistry
from Core.Container.Container import (
    setEngineRegistry, setCompilerRegistry, setExecutorRegistry, setPromptManager,
    setAnalysisCodeService, setCompilationCodeService, setExecutionCodeService, setOptimizationCodeService,
    setErrorCodeService
)
from Application.Prompts.PromptManager import PromptManager
from Application.Services.AnalysisCodeService import AnalysisCodeService
from Application.Services.CompilationCodeService import CompilationCodeService
from Application.Services.ExecutionCodeService import ExecutionCodeService
from Application.Services.OptimizationCodeService import OptimizationCodeService
from Application.Services.ErrorCodeService import ErrorCodeService

from Presentation.Routers.CompilationCodeRouter import router as compilationRouter
from Presentation.Routers.ExecutionCodeRouter import router as executionRouter
from Presentation.Routers.AnalysisCodeRouter import router as analysisRouter
from Presentation.Routers.OptimizationCodeRouter import router as optimizationRouter
from Presentation.Routers.PromptRouter import router as promptRouter

def createApp():
    app = FastAPI(title="CodeJudge", version="1.0")

    configurationManager = ConfigurationManager()

    # Registries
    engineRegistry = EngineRegistry(configurationManager)
    compilerRegistry = CompilerRegistry(configurationManager)
    executorRegistry = ExecutorRegistry(configurationManager)
    promptManager = PromptManager(configurationManager)

    setEngineRegistry(engineRegistry)
    setCompilerRegistry(compilerRegistry)
    setExecutorRegistry(executorRegistry)
    setPromptManager(promptManager)

    # Services
    errorService = ErrorCodeService(engineRegistry, promptManager)
    analysisService = AnalysisCodeService(engineRegistry, promptManager)
    compilationService = CompilationCodeService(compilerRegistry, errorService)
    executionService = ExecutionCodeService(compilerRegistry, executorRegistry, errorService)
    optimizationService = OptimizationCodeService(engineRegistry, promptManager)

    setAnalysisCodeService(analysisService)
    setCompilationCodeService(compilationService)
    setExecutionCodeService(executionService)
    setOptimizationCodeService(optimizationService)
    setErrorCodeService(errorService)
    
    # Usar ´só enquanto tiver no computador localmente
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Routers
    app.include_router(compilationRouter)
    app.include_router(executionRouter)
    app.include_router(analysisRouter)
    app.include_router(optimizationRouter)
    app.include_router(promptRouter)

    return app

app = createApp()

if __name__ == '__main__':
    uvicorn.run('Main:app', host='0.0.0.0', port=8000, reload=True)