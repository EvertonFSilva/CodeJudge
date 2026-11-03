from Application.UseCases.GetAiModelsUseCase import GetAiModelsUseCase
from Presentation.Schemas.Responses.AiModelsResponse import AiModelsResponse

class AiController:
    def __init__(self, getAiModelsUseCase: GetAiModelsUseCase):
        self.getAiModelsUseCase = getAiModelsUseCase

    def getSupportedModels(self) -> AiModelsResponse:
        data = self.getAiModelsUseCase.execute()
        return AiModelsResponse(
            success=True,
            isUserKeyRequired=data["isUserKeyRequired"],
            defaultEngine=data["defaultEngine"],
            defaultModel=data["defaultModel"],
            engines=data["engines"]
        )
