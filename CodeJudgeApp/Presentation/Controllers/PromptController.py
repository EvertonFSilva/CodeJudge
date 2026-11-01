from Application.UseCases.PromptUseCase import PromptUseCase
from fastapi.responses import JSONResponse

class PromptController:
    def __init__(self, promptUseCase: PromptUseCase):
        self.promptUseCase = promptUseCase

    def getAll(self) -> JSONResponse:
        templates = self.promptUseCase.getAll()
        return JSONResponse(content={"templates": templates})

    def getByCategory(self, category: str) -> JSONResponse:
        templates = self.promptUseCase.getByCategory(category)
        return JSONResponse(content={"templates": templates})

    def getSingle(self, category: str, name: str) -> JSONResponse:
        template = self.promptUseCase.getSingle(category, name)
        if not template:
            return JSONResponse(status_code=404, content={"message": "Prompt template not found."})
        return JSONResponse(content=template)
