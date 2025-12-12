from pydantic import BaseModel

class ExecutionCodeRequest(BaseModel):
    statement: str
    language: str
    code: str
    tests: list = []
