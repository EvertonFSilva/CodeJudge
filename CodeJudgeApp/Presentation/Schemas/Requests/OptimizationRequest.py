from pydantic import BaseModel
from typing import Optional

class OptimizationRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
    apiKey: Optional[str] = None
    engine: Optional[str] = None
    model: Optional[str] = None
