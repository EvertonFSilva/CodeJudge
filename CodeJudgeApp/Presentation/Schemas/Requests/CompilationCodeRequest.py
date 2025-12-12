from pydantic import BaseModel

class CompilationCodeRequest(BaseModel):
    statement: str
    language: str
    code: str
