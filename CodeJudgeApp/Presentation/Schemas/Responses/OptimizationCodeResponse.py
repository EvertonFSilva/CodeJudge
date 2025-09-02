from pydantic import BaseModel

class OptimizationCodeResponse(BaseModel):
    success: bool
    message: str
