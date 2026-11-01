from typing import List
import re

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

    @staticmethod
    def normalizeCodeFences(text: str) -> str:
        if not text:
            return ""
        res = re.sub(r'^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)$', r'\1\n\2', text, flags=re.MULTILINE)
        res = re.sub(r'^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)[ \t]+([^\r\n]+)$', r'\1\n\2\n\3', res, flags=re.MULTILINE)
        res = re.sub(r'^(?!```)(.+?)[ \t]*(```\s*)$', r'\1\n```', res, flags=re.MULTILINE)
        return res

    def build(self) -> str:
        parts: List[str] = []
        if self.guideline:
            parts.append(self.guideline)
        parts.extend(self.sections)
        parts.append(
            "DIRETRIZ DE FORMATAÇÃO: Sempre formate qualquer bloco de código com a cerca tripla (```) iniciando em uma nova linha isolada."
        )
        return "\n\n".join(parts)
