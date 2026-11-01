from dataclasses import dataclass

@dataclass(slots=True)
class ExecutionMetrics:
    totalTests: int
    passedTests: int
    successRate: int
    allPassed: bool

    @classmethod
    def calculate(cls, total: int, passed: int) -> "ExecutionMetrics":
        rate = int((passed / total) * 100) if total > 0 else 0
        return cls(
            totalTests=total,
            passedTests=passed,
            successRate=rate,
            allPassed=(total > 0 and passed == total)
        )
