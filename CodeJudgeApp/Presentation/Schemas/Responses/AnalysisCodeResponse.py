from pydantic import BaseModel

class AnalysisCodeResponse(BaseModel):
    success: bool
    message: str
