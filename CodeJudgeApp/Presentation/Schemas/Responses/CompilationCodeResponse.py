from pydantic import BaseModel

class CompilationCodeResponse(BaseModel):
    success: bool
    message: str
    sourcePath: str
    logs: str
