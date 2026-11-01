from pydantic import BaseModel

class DiagnosticResponse(BaseModel):
    success: bool
    feedback: str
