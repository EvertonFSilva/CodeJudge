from fastapi import APIRouter, Body
from Presentation.Schemas.Requests.CompilationRequest import CompilationRequest
from Presentation.Schemas.Responses.CompilationResponse import CompilationResponse
from Presentation.Controllers.CompilationController import CompilationController

def createCompilationRouter(controller: CompilationController) -> APIRouter:
    router = APIRouter(prefix="/compilation", tags=["compilation"])

    @router.post("/run", response_model=CompilationResponse)
    def runCompilation(request: CompilationRequest = Body(...)) -> CompilationResponse:
        return controller.compile(request)

    return router
