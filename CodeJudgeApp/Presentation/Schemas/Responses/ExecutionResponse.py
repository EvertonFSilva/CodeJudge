from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ExecutionResponse(BaseModel):
    success: bool
    message: str
    inputs: Optional[List[str]] = []
    outputs: Optional[List[Any]] = []
    rate: Optional[int] = None
    details: Optional[Dict[str, Any]] = {}
    rawOutput: Optional[str] = ""
    feedback: Optional[str] = None
    durationMs: Optional[float] = None
