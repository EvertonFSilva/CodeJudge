from typing import Optional
from fastapi import APIRouter, Body, Query, Header
from Presentation.Schemas.Requests.AnalysisRequest import AnalysisRequest
from Presentation.Schemas.Responses.AnalysisResponse import AnalysisResponse
from Presentation.Controllers.AnalysisController import AnalysisController

def createAnalysisRouter(controller: AnalysisController) -> APIRouter:
    router = APIRouter(prefix="/analysis", tags=["analysis"])

    @router.post("/run", response_model=AnalysisResponse)
    def runAnalysis(
        request: AnalysisRequest = Body(...),
        apiKey: Optional[str] = Query(default=None),
        engine: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        xApiKey: Optional[str] = Header(default=None, alias="X-Api-Key")
    ) -> AnalysisResponse:
        request.applyOverrides(apiKey=apiKey, engine=engine, model=model, xApiKey=xApiKey)
        return controller.analyze(request)

    return router
