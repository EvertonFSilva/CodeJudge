from Application.UseCases.GetLanguagesUseCase import GetLanguagesUseCase
from Presentation.Schemas.Responses.LanguageResponse import LanguageResponse

class LanguageController:
    def __init__(self, getLanguagesUseCase: GetLanguagesUseCase):
        self.getLanguagesUseCase = getLanguagesUseCase

    def getAll(self) -> LanguageResponse:
        languages = self.getLanguagesUseCase.execute()
        return LanguageResponse(success=True, languages=languages)
