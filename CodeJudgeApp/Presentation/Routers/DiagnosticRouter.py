from typing import Optional
from fastapi import APIRouter, Body, Query, Header
from Presentation.Schemas.Requests.DiagnosticRequest import DiagnosticRequest
from Presentation.Schemas.Responses.DiagnosticResponse import DiagnosticResponse
from Presentation.Controllers.DiagnosticController import DiagnosticController

def createDiagnosticRouter(controller: DiagnosticController) -> APIRouter:
    router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])

    @router.post("/run", response_model=DiagnosticResponse)
    def runDiagnostic(
        request: DiagnosticRequest = Body(...),
        apiKey: Optional[str] = Query(default=None),
        engine: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        xApiKey: Optional[str] = Header(default=None, alias="X-Api-Key")
    ) -> DiagnosticResponse:
        request.applyOverrides(apiKey=apiKey, engine=engine, model=model, xApiKey=xApiKey)
        return controller.diagnose(request)

    return router
