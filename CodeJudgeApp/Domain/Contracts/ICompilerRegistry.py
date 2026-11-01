from abc import ABC, abstractmethod
from typing import Optional
from Domain.Contracts.ICompiler import ICompiler

class ICompilerRegistry(ABC):
    @abstractmethod
    def getCompiler(self, language: str) -> Optional[ICompiler]:
        pass
