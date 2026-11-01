from fastapi import APIRouter, Body
from Presentation.Schemas.Requests.ExecutionRequest import ExecutionRequest
from Presentation.Schemas.Responses.ExecutionResponse import ExecutionResponse
from Presentation.Controllers.ExecutionController import ExecutionController

def createExecutionRouter(controller: ExecutionController) -> APIRouter:
    router = APIRouter(prefix="/execution", tags=["execution"])

    @router.post("/run", response_model=ExecutionResponse)
    def runExecution(request: ExecutionRequest = Body(...)) -> ExecutionResponse:
        return controller.execute(request)

    return router
