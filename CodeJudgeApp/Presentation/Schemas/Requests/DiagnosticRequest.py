from pydantic import BaseModel
from typing import Optional

class DiagnosticRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
    logs: Optional[str] = ""
    errorType: Optional[str] = "compilation"
    apiKey: Optional[str] = None
    engine: Optional[str] = None
    model: Optional[str] = None
