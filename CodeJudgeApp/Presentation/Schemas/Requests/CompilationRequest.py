from pydantic import BaseModel
from typing import Optional

class CompilationRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
