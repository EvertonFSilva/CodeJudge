from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class IAiEngine(ABC):
    @abstractmethod
    def complete(self, prompt: str, parameters: Optional[Dict[str, Any]] = None) -> str:
        pass

    @abstractmethod
    def isAvailable(self) -> bool:
        pass

    def isLocalEngine(self) -> bool:
        return False
