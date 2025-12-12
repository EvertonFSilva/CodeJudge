from pydantic import BaseModel

class AnalysisCodeRequest(BaseModel):
    statement: str
    language: str
    code: str
