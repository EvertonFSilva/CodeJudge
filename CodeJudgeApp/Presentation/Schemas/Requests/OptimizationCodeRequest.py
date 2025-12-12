from pydantic import BaseModel

class OptimizationCodeRequest(BaseModel):
    statement: str
    language: str
    code: str
