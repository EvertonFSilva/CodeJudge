from pydantic import BaseModel
from typing import Dict, List

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
    allowUserKeyOverride: bool = True
    defaultEngine: str
    defaultModel: str
    models: List[str]
    providers: Dict[str, List[str]]
    engines: List[AiEngineItem]
