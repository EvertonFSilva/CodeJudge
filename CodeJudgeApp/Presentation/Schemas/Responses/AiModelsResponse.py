from pydantic import BaseModel
from typing import List

class AiEngineItem(BaseModel):
    key: str
    name: str
    adapter: str
    defaultModel: str
    supportedModels: List[str]
    requiresApiKey: bool
    isDefault: bool

class AiModelsResponse(BaseModel):
    success: bool
    isUserKeyRequired: bool
    defaultEngine: str
    defaultModel: str
    engines: List[AiEngineItem]
