from pydantic import BaseModel
from typing import Optional

class CompilationResponse(BaseModel):
    success: bool
    message: str
    sourcePath: Optional[str] = None
    logs: Optional[str] = ""
    durationMs: Optional[float] = None
