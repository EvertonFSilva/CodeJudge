from fastapi import APIRouter, Body
from Presentation.Schemas.Requests.AnalysisRequest import AnalysisRequest
from Presentation.Schemas.Responses.AnalysisResponse import AnalysisResponse
from Presentation.Controllers.AnalysisController import AnalysisController

def createAnalysisRouter(controller: AnalysisController) -> APIRouter:
    router = APIRouter(prefix="/analysis", tags=["analysis"])

    @router.post("/run", response_model=AnalysisResponse)
    def runAnalysis(request: AnalysisRequest = Body(...)) -> AnalysisResponse:
        return controller.analyze(request)

    return router
