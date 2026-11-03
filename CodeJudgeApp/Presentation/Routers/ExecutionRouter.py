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
        request.applyOverrides(apiKey=apiKey, engine=engine, model=model, xApiKey=xApiKey)
        return controller.execute(request)

    return router
