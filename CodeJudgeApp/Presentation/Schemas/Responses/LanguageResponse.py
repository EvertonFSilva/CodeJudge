from pydantic import BaseModel
from typing import List

class LanguageItem(BaseModel):
    key: str
    name: str
    sourceExtension: str
    targetExtension: str
    needsCompilation: bool

class LanguageResponse(BaseModel):
    success: bool
    languages: List[LanguageItem]
