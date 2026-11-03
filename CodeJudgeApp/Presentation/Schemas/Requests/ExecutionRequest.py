from typing import Optional, List, Dict, Any
from Presentation.Schemas.Requests.BaseCodeRequest import BaseCodeRequest

class ExecutionRequest(BaseCodeRequest):
    tests: Optional[List[Dict[str, Any]]] = []
