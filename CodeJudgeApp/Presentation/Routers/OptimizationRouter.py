from fastapi import APIRouter, Body
from Presentation.Schemas.Requests.OptimizationRequest import OptimizationRequest
from Presentation.Schemas.Responses.OptimizationResponse import OptimizationResponse
from Presentation.Controllers.OptimizationController import OptimizationController

def createOptimizationRouter(controller: OptimizationController) -> APIRouter:
    router = APIRouter(prefix="/optimization", tags=["optimization"])

    @router.post("/run", response_model=OptimizationResponse)
    def runOptimization(request: OptimizationRequest = Body(...)) -> OptimizationResponse:
        return controller.optimize(request)

    return router
