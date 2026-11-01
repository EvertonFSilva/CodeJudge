from abc import ABC, abstractmethod
from typing import Dict, Optional
from Domain.Entities.PromptDocument import PromptDocument

class IPromptRepository(ABC):
    @abstractmethod
    def getTemplate(self, category: str, templateName: str) -> Optional[PromptDocument]:
        pass

    @abstractmethod
    def getByCategory(self, category: str) -> Dict[str, PromptDocument]:
        pass

    @abstractmethod
    def listAll(self) -> Dict[str, Dict[str, PromptDocument]]:
        pass
