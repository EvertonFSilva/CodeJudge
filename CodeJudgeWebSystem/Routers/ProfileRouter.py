from fastapi import APIRouter, Header
from Controllers.ProfileController import ProfileController
from Presentation.Schemas.Responses.ProfileResponse import ProfileResponse

ProfileRouter = APIRouter(prefix="/auth", tags=["profile"])
profileController = ProfileController()

@ProfileRouter.get("/profile", response_model=ProfileResponse,
                   summary="Obtém perfil do usuário",
                   description="Retorna dados do usuário logado pelo token")
async def getUserProfile(x_auth_token = Header(...)):
    result = profileController.getProfile(x_auth_token)
    return ProfileResponse(success=result.success, message=result.message, profile=result.profile)