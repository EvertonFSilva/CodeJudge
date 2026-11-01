from dataclasses import dataclass, field
from typing import List, Optional

@dataclass(slots=True)
class Feedback:
    score: Optional[int] = None
    summary: str = ""
    recommendations: List[str] = field(default_factory=list)
    rawMarkdown: str = ""
