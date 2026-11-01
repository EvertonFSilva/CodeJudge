from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ExecutionRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
    tests: Optional[List[Dict[str, Any]]] = []
