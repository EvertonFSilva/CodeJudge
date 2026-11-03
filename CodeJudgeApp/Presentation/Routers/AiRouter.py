from fastapi import APIRouter
from Presentation.Schemas.Responses.AiModelsResponse import AiModelsResponse
from Presentation.Controllers.AiController import AiController

def createAiRouter(controller: AiController) -> APIRouter:
    router = APIRouter(prefix="/ai", tags=["ai"])

    @router.get("", response_model=AiModelsResponse)
    @router.get("/all", response_model=AiModelsResponse)
    @router.get("/models", response_model=AiModelsResponse)
    @router.get("/supported", response_model=AiModelsResponse)
    def getSupportedAiModels() -> AiModelsResponse:
        return controller.getSupportedModels()

    return router
