from pydantic import BaseModel
from typing import Optional

class OptimizationResponse(BaseModel):
    success: bool
    message: str
    recommendations: Optional[str] = None
    durationMs: Optional[float] = None
