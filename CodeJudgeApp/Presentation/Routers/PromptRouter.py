from fastapi import APIRouter
from fastapi.responses import JSONResponse
from Presentation.Controllers.PromptController import PromptController

def createPromptRouter(controller: PromptController) -> APIRouter:
    router = APIRouter(prefix="/prompts", tags=["prompts"])

    @router.get("/all")
    def getAllPrompts() -> JSONResponse:
        return controller.getAll()

    @router.get("/category/{category}")
    def getCategoryPrompts(category: str) -> JSONResponse:
        return controller.getByCategory(category)

    @router.get("/single/{category}/{promptName}")
    def getSinglePrompt(category: str, promptName: str) -> JSONResponse:
        return controller.getSingle(category, promptName)

    return router
