from typing import Optional
from fastapi import APIRouter, Body, Query, Header
from Presentation.Schemas.Requests.OptimizationRequest import OptimizationRequest
from Presentation.Schemas.Responses.OptimizationResponse import OptimizationResponse
from Presentation.Controllers.OptimizationController import OptimizationController

def createOptimizationRouter(controller: OptimizationController) -> APIRouter:
    router = APIRouter(prefix="/optimization", tags=["optimization"])

    @router.post("/run", response_model=OptimizationResponse)
    def runOptimization(
        request: OptimizationRequest = Body(...),
        apiKey: Optional[str] = Query(default=None),
        engine: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        xApiKey: Optional[str] = Header(default=None, alias="X-Api-Key")
    ) -> OptimizationResponse:
        request.applyOverrides(apiKey=apiKey, engine=engine, model=model, xApiKey=xApiKey)
        return controller.optimize(request)

    return router
