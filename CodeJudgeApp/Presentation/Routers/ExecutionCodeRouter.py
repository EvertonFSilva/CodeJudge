from fastapi import APIRouter, Depends, Body
from Core.Container.Container import getExecutionCodeService
from Presentation.Schemas.Requests.ExecutionCodeRequest import ExecutionCodeRequest
from Presentation.Schemas.Responses.ExecutionCodeResponse import ExecutionCodeResponse
from Application.Controllers.ExecutionCodeController import ExecutionCodeController

router = APIRouter(prefix="/execution", tags=["execution"])

def getController():
    service = getExecutionCodeService()
    return ExecutionCodeController(service)

@router.post("/run", response_model=ExecutionCodeResponse,
             summary="Executa testes em código",
             description="Executa os testes fornecidos sobre um trecho de código em determinada linguagem.")
def runExecution(request: ExecutionCodeRequest = Body(...),
                 controller: ExecutionCodeController = Depends(getController)):
    result = controller.execute(request.language, request.code, request.tests or [])
    return ExecutionCodeResponse(success=result.isSuccess(), message=result.getMessage(), inputs=result.getInputs(), outputs=result.getOutputs(), rate=result.getRate(), details=result.getDetails())
