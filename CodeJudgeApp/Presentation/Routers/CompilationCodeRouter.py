from fastapi import APIRouter, Depends, Body
from Core.Container.Container import getCompilationCodeService
from Presentation.Schemas.Requests.CompilationCodeRequest import CompilationCodeRequest
from Presentation.Schemas.Responses.CompilationCodeResponse import CompilationCodeResponse
from Application.Controllers.CompilationCodeController import CompilationCodeController

router = APIRouter(prefix="/compilation", tags=["compilation"])

def getController():
    service = getCompilationCodeService()
    return CompilationCodeController(service)

@router.post("/run", response_model=CompilationCodeResponse,
             summary="Compila código fonte",
             description="Recebe um trecho de código e a linguagem, compila o código e retorna sucesso ou falha, mensagens, logs e caminho do código compilado.")
def runCompilation(request: CompilationCodeRequest = Body(...),
                   controller: CompilationCodeController = Depends(getController)):
    result = controller.compile(request.statement, request.language, request.code)
    sourcePath = getattr(result, "getSourcePath", lambda: None)()
    logs = getattr(result, "getLogs", lambda: None)()
    return CompilationCodeResponse(success=result.isSuccess(), message=result.getMessage(), sourcePath=sourcePath, logs=logs)
