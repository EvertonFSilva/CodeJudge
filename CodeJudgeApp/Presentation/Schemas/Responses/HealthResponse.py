from pydantic import BaseModel
from typing import Dict, Any

class HealthResponse(BaseModel):
    status: str
    compilers: Dict[str, Any]
    ai: Dict[str, Any]
