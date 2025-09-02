from pydantic import BaseModel

class AnalysisCodeRequest(BaseModel):
    language: str
    code: str
