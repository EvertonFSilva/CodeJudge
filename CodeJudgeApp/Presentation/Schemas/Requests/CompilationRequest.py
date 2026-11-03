from pydantic import BaseModel
from typing import Optional

class CompilationRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
    apiKey: Optional[str] = None
    engine: Optional[str] = None
    model: Optional[str] = None
