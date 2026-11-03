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
        if not request.apiKey:
            request.apiKey = apiKey or xApiKey
        if not request.engine and engine:
            request.engine = engine
        if not request.model and model:
            request.model = model
        return controller.compile(request)

    return router
