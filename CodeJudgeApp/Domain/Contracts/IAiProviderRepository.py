from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from Domain.Entities.AiModelProvider import AiModelProvider

class IAiProviderRepository(ABC):
    @abstractmethod
    def isUserKeyRequired(self) -> bool:
        pass

    @abstractmethod
    def getDefaultEngineName(self) -> str:
        pass

    @abstractmethod
    def getAllAiProviders(self) -> Dict[str, AiModelProvider]:
        pass

    @abstractmethod
    def getAiProvider(self, engineKey: str) -> Optional[AiModelProvider]:
        pass

    @abstractmethod
    def getSupportedModels(self, engineKey: Optional[str] = None) -> List[str]:
        pass

    @abstractmethod
    def resolveEngineAndModel(
        self,
        requestedEngine: Optional[str] = None,
        requestedModel: Optional[str] = None
    ) -> Tuple[str, str]:
        pass
