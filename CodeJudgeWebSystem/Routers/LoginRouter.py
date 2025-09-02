from fastapi import APIRouter, Body
from Controllers.LoginController import LoginController
from Presentation.Schemas.Requests.LoginRequest import LoginRequest
from Presentation.Schemas.Responses.LoginResponse import LoginResponse

LoginRouter = APIRouter(prefix="/auth", tags=["login"])
loginController = LoginController()

@LoginRouter.post("/login", response_model=LoginResponse,
                  summary="Autentica usuário",
                  description="Faz login e retorna token de sessão")
async def loginUser(request: LoginRequest = Body(...)):
    result = loginController.authenticate(request)
    return LoginResponse(
        success=result.success,
        message=result.message,
        authToken=result.authToken,
        profile=result.profile
    )
