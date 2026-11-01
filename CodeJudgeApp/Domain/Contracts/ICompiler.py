from abc import ABC, abstractmethod
from Domain.Entities.SourceCode import SourceCode
from Domain.Reports.CompilationReport import CompilationReport

class ICompiler(ABC):
    @abstractmethod
    def compile(self, source: SourceCode) -> CompilationReport:
        pass
