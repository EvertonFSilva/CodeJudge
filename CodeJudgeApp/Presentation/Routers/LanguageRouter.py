from fastapi import APIRouter
from Presentation.Schemas.Responses.LanguageResponse import LanguageResponse
from Presentation.Controllers.LanguageController import LanguageController

def createLanguageRouter(controller: LanguageController) -> APIRouter:
    router = APIRouter(prefix="/languages", tags=["languages"])

    @router.get("", response_model=LanguageResponse)
    @router.get("/all", response_model=LanguageResponse)
    def getLanguages() -> LanguageResponse:
        return controller.getAll()

    return router
