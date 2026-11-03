from typing import List
import re

_FENCE_START_RE = re.compile(r'^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)$', flags=re.MULTILINE)
_FENCE_INLINE_RE = re.compile(r'^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)[ \t]+([^\r\n]+)$', flags=re.MULTILINE)
_FENCE_END_RE = re.compile(r'^(?!```)(.+?)[ \t]*(```\s*)$', flags=re.MULTILINE)

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
        res = _FENCE_START_RE.sub(r'\1\n\2', text)
        res = _FENCE_INLINE_RE.sub(r'\1\n\2\n\3', res)
        res = _FENCE_END_RE.sub(r'\1\n```', res)
        return res

    def build(self) -> str:
        parts: List[str] = []
        if self.guideline:
            parts.append(self.guideline)
        parts.extend(self.sections)
        parts.append(
            "DIRETRIZ DE OBJETIVIDADE: Seja estritamente direto, técnico e conciso. Não inclua saudações, apresentações, sermões, introduções conversacionais ou divagações teóricas. Responda exclusivamente no formato e estrutura pré-definida de saída esperada."
        )
        parts.append(
            "DIRETRIZ DE FORMATAÇÃO: Sempre formate qualquer bloco de código com a cerca tripla (```) iniciando em uma nova linha isolada."
        )
        return "\n\n".join(parts)
