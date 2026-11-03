from typing import Optional
from Application.UseCases.GetAiModelsUseCase import GetAiModelsUseCase
from Presentation.Schemas.Responses.AiModelsResponse import AiModelsResponse

class AiController:
    def __init__(self, getAiModelsUseCase: GetAiModelsUseCase):
        self.getAiModelsUseCase = getAiModelsUseCase

    def getSupportedModels(self, engineKey: Optional[str] = None) -> AiModelsResponse:
        data = self.getAiModelsUseCase.execute(engineKey=engineKey)
        return AiModelsResponse(
            success=True,
            isUserKeyRequired=data["isUserKeyRequired"],
            allowUserKeyOverride=data["allowUserKeyOverride"],
            defaultEngine=data["defaultEngine"],
            defaultModel=data["defaultModel"],
            models=data["models"],
            providers=data["providers"],
            engines=data["engines"]
        )
