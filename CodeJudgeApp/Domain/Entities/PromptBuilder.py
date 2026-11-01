from typing import List

class PromptBuilder:
    def __init__(self, guideline: str = ""):
        self.guideline: str = guideline.strip()
        self.sections: List[str] = []

    def withGuideline(self, guideline: str) -> "PromptBuilder":
        self.guideline = guideline.strip()
        return self

    def withSection(self, title: str, content: str) -> "PromptBuilder":
        if content and content.strip():
            self.sections.append(f"### {title}:\n{content.strip()}")
        return self

    def withCodeBlock(self, language: str, code: str) -> "PromptBuilder":
        langKey = language.strip().lower()
        self.sections.append(f"### Código-Fonte ({language.upper()}):\n```{langKey}\n{code.strip()}\n```")
        return self

    def withLabeledContext(self, label: str, value: str) -> "PromptBuilder":
        if value and value.strip():
            self.sections.append(f"[{label}]: {value.strip()}")
        return self

    def build(self) -> str:
        parts: List[str] = []
        if self.guideline:
            parts.append(self.guideline)
        parts.extend(self.sections)
        return "\n\n".join(parts)
