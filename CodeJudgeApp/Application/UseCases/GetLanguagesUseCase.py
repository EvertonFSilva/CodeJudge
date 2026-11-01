from typing import List, Dict, Any
from Domain.Contracts.ILanguageRepository import ILanguageRepository

class GetLanguagesUseCase:
    def __init__(self, languageRepository: ILanguageRepository):
        self.languageRepository = languageRepository

    def execute(self) -> List[Dict[str, Any]]:
        languages = self.languageRepository.getAllLanguages()
        return [
            {
                "key": lang.key,
                "name": lang.name,
                "sourceExtension": lang.sourceExtension,
                "targetExtension": lang.targetExtension,
                "needsCompilation": lang.needsCompilation()
            }
            for lang in languages.values()
        ]
