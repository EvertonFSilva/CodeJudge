from abc import ABC, abstractmethod
from typing import Dict, Optional
from Domain.Entities.Language import Language

class ILanguageRepository(ABC):
    @abstractmethod
    def getLanguage(self, language: str) -> Optional[Language]:
        pass

    @abstractmethod
    def getAllLanguages(self) -> Dict[str, Language]:
        pass

    @abstractmethod
    def isLanguageSupported(self, language: str) -> bool:
        pass

    @abstractmethod
    def getExecutionTimeout(self) -> int:
        pass
