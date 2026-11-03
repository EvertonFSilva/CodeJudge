from typing import Optional
from Presentation.Schemas.Requests.BaseCodeRequest import BaseCodeRequest

class DiagnosticRequest(BaseCodeRequest):
    logs: Optional[str] = ""
    errorType: Optional[str] = "compilation"
