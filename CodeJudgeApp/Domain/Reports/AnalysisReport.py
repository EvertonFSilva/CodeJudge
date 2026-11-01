from dataclasses import dataclass

@dataclass(slots=True)
class AnalysisReport:
    success: bool
    message: str
    feedback: str = ""
    durationMs: float = 0.0
