from fastapi import APIRouter
from Presentation.Schemas.Responses.HealthResponse import HealthResponse
from Presentation.Controllers.HealthController import HealthController

def createHealthRouter(controller: HealthController) -> APIRouter:
    router = APIRouter(tags=["health"])

    @router.get("/health", response_model=HealthResponse)
    def checkHealth() -> HealthResponse:
        return controller.check()

    return router
