from abc import ABC, abstractmethod
from typing import List, Optional
from Domain.Entities.TestScenario import TestScenario
from Domain.Reports.ExecutionReport import ExecutionReport

class IExecutor(ABC):
    @abstractmethod
    def execute(
        self,
        targetPath: str,
        scenarios: Optional[List[TestScenario]] = None,
        timeoutSeconds: int = 10
    ) -> ExecutionReport:
        pass
