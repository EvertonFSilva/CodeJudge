from fastapi import APIRouter, Depends, Body
from Core.Container.Container import getAnalysisCodeService
from Presentation.Schemas.Requests.AnalysisCodeRequest import AnalysisCodeRequest
from Presentation.Schemas.Responses.AnalysisCodeResponse import AnalysisCodeResponse
from Application.Controllers.AnalysisCodeController import AnalysisCodeController

router = APIRouter(prefix="/analysis", tags=["analysis"])

def getController():
    service = getAnalysisCodeService()
    return AnalysisCodeController(service)

@router.post("/run", response_model=AnalysisCodeResponse,
             summary="Executa análise de código",
             description="Recebe um trecho de código e a linguagem, e retorna o resultado da análise.")
def runAnalysis(request: AnalysisCodeRequest = Body(...),
                controller: AnalysisCodeController = Depends(getController)):
    result = controller.analyze(request.language, request.code)
    return AnalysisCodeResponse(success=result.isSuccess(), message=result.getMessage())
