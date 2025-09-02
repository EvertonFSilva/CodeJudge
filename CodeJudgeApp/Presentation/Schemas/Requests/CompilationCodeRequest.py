from pydantic import BaseModel

class CompilationCodeRequest(BaseModel):
    language: str
    code: str
