from pydantic import BaseModel

class ExecutionCodeResponse(BaseModel):
    success: bool
    message: str
    inputs: list = []
    outputs: list = []
    rate: float = 0.0
    details: dict = {}
