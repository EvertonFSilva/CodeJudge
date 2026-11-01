from pydantic import BaseModel
from typing import Optional

class AnalysisResponse(BaseModel):
    success: bool
    message: str
    feedback: Optional[str] = None
    durationMs: Optional[float] = None
