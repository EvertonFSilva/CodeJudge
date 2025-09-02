from pydantic import BaseModel

class OptimizationCodeRequest(BaseModel):
    language: str
    code: str
