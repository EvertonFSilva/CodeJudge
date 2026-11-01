from pydantic import BaseModel
from typing import Optional

class OptimizationRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
