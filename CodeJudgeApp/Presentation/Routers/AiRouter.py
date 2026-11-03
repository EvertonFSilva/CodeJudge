from typing import Optional
from fastapi import APIRouter, Query
from Presentation.Schemas.Responses.AiModelsResponse import AiModelsResponse
from Presentation.Controllers.AiController import AiController

def createAiRouter(controller: AiController) -> APIRouter:
    router = APIRouter(prefix="/ai", tags=["ai"])

    @router.get("", response_model=AiModelsResponse)
    @router.get("/all", response_model=AiModelsResponse)
    @router.get("/models", response_model=AiModelsResponse)
    @router.get("/supported", response_model=AiModelsResponse)
    def getSupportedAiModels(engine: Optional[str] = Query(default=None)) -> AiModelsResponse:
        return controller.getSupportedModels(engineKey=engine)

    @router.get("/models/{engineKey}", response_model=AiModelsResponse)
    def getEngineSupportedModels(engineKey: str) -> AiModelsResponse:
        return controller.getSupportedModels(engineKey=engineKey)

    return router
