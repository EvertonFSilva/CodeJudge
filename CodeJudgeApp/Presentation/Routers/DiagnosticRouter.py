from fastapi import APIRouter, Body
from Presentation.Schemas.Requests.DiagnosticRequest import DiagnosticRequest
from Presentation.Schemas.Responses.DiagnosticResponse import DiagnosticResponse
from Presentation.Controllers.DiagnosticController import DiagnosticController

def createDiagnosticRouter(controller: DiagnosticController) -> APIRouter:
    router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])

    @router.post("/run", response_model=DiagnosticResponse)
    def runDiagnostic(request: DiagnosticRequest = Body(...)) -> DiagnosticResponse:
        return controller.diagnose(request)

    return router
