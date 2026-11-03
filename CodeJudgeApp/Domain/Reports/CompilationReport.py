from dataclasses import dataclass
from typing import Optional

@dataclass(slots=True)
class CompilationReport:
    success: bool
    message: str
    binaryPath: Optional[str] = None
    logs: str = ""
    durationMs: float = 0.0
    workspaceDirectory: Optional[str] = None
    feedback: Optional[str] = None
