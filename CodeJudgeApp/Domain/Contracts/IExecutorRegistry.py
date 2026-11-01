from abc import ABC, abstractmethod
from typing import Optional
from Domain.Contracts.IExecutor import IExecutor

class IExecutorRegistry(ABC):
    @abstractmethod
    def getExecutor(self, language: str) -> Optional[IExecutor]:
        pass
