from pydantic import BaseModel
from typing import Optional

class AnalysisRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
