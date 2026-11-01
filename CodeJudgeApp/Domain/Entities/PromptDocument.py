from dataclasses import dataclass

@dataclass(slots=True)
class PromptDocument:
    name: str
    description: str
    category: str
    content: str
