from dataclasses import dataclass

@dataclass(slots=True)
class OptimizationReport:
    success: bool
    message: str
    recommendations: str = ""
    durationMs: float = 0.0
