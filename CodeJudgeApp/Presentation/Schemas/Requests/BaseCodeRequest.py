from typing import Optional
from pydantic import BaseModel

class BaseCodeRequest(BaseModel):
    statement: Optional[str] = ""
    language: str
    code: str
    apiKey: Optional[str] = None
    engine: Optional[str] = None
    model: Optional[str] = None

    def applyOverrides(
        self,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None,
        xApiKey: Optional[str] = None
    ) -> "BaseCodeRequest":
        if not self.apiKey:
            self.apiKey = apiKey or xApiKey
        if not self.engine and engine:
            self.engine = engine
        if not self.model and model:
            self.model = model
        return self
