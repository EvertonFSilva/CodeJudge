from fastapi import APIRouter, Depends, Body
from Core.Container.Container import getOptimizationCodeService
from Presentation.Schemas.Requests.OptimizationCodeRequest import OptimizationCodeRequest
from Presentation.Schemas.Responses.OptimizationCodeResponse import OptimizationCodeResponse
from Application.Controllers.OptimizationCodeController import OptimizationCodeController

router = APIRouter(prefix="/optimization", tags=["optimization"])

def getController():
    service = getOptimizationCodeService()
    return OptimizationCodeController(service)

@router.post("/run", response_model=OptimizationCodeResponse,
             summary="Otimiza código fonte",
             description="Recebe um trecho de código e a linguagem, aplica otimizações e retorna sucesso ou falha.")
def runOptimization(request: OptimizationCodeRequest = Body(...),
                    controller: OptimizationCodeController = Depends(getController)):
    result = controller.optimize(request.language, request.code)
    return OptimizationCodeResponse(success=result.isSuccess(), message=result.getMessage())