from pydantic import BaseModel

class ExecutionCodeRequest(BaseModel):
    language: str
    code: str
    tests: list = []
