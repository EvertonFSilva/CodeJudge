from typing import Optional
from fastapi import APIRouter, Body, Query, Header
from Presentation.Schemas.Requests.CompilationRequest import CompilationRequest
from Presentation.Schemas.Responses.CompilationResponse import CompilationResponse
from Presentation.Controllers.CompilationController import CompilationController

def createCompilationRouter(controller: CompilationController) -> APIRouter:
    router = APIRouter(prefix="/compilation", tags=["compilation"])

    @router.post("/run", response_model=CompilationResponse)
    def runCompilation(
        request: CompilationRequest = Body(...),
        apiKey: Optional[str] = Query(default=None),
        engine: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        xApiKey: Optional[str] = Header(default=None, alias="X-Api-Key")
    ) -> CompilationResponse:
        request.applyOverrides(apiKey=apiKey, engine=engine, model=model, xApiKey=xApiKey)
        return controller.compile(request)

    return router
