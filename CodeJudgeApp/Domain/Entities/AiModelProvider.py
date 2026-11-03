from dataclasses import dataclass, field
from typing import List

@dataclass(frozen=True)
class AiModelProvider:
    key: str
    name: str
    adapter: str
    defaultModel: str
    supportedModels: List[str] = field(default_factory=list)
    requiresApiKey: bool = True
    isDefault: bool = False
