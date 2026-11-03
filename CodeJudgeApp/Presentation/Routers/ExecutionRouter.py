from typing import Optional
from fastapi import APIRouter, Body, Query, Header
from Presentation.Schemas.Requests.ExecutionRequest import ExecutionRequest
from Presentation.Schemas.Responses.ExecutionResponse import ExecutionResponse
from Presentation.Controllers.ExecutionController import ExecutionController

def createExecutionRouter(controller: ExecutionController) -> APIRouter:
    router = APIRouter(prefix="/execution", tags=["execution"])

    @router.post("/run", response_model=ExecutionResponse)
    def runExecution(
        request: ExecutionRequest = Body(...),
        apiKey: Optional[str] = Query(default=None),
        engine: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        xApiKey: Optional[str] = Header(default=None, alias="X-Api-Key")
    ) -> ExecutionResponse:
        if not request.apiKey:
            request.apiKey = apiKey or xApiKey
        if not request.engine and engine:
            request.engine = engine
        if not request.model and model:
            request.model = model
        return controller.execute(request)

    return router
