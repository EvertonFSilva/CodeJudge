from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass(slots=True)
class ExecutionReport:
    success: bool
    message: str
    inputs: List[str] = field(default_factory=list)
    outputs: List[Any] = field(default_factory=list)
    rate: Optional[int] = None
    details: Dict[str, Any] = field(default_factory=dict)
    rawOutput: str = ""
    durationMs: float = 0.0
