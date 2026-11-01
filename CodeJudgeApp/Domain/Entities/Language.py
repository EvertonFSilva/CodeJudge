import re
from dataclasses import dataclass, field
from typing import List, Optional
import javalang

@dataclass(slots=True)
class Language:
    key: str
    name: str
    sourceExtension: str
    targetExtension: str
    entryNamingStrategy: str
    compilerCommand: Optional[str] = None
    compilerArguments: List[str] = field(default_factory=list)
    executorCommand: str = ""
    executorArguments: List[str] = field(default_factory=list)

    def needsCompilation(self) -> bool:
        return bool(self.compilerCommand and self.compilerCommand.strip())

    def detectMainClassName(self, code: str) -> str:
        try:
            syntaxTree = javalang.parse.parse(code)
            for _, node in syntaxTree.filter(javalang.tree.ClassDeclaration):
                if any(method.name == "main" for method in node.methods):
                    return node.name
            for _, node in syntaxTree.filter(javalang.tree.ClassDeclaration):
                if "public" in node.modifiers:
                    return node.name
            for _, node in syntaxTree.filter(javalang.tree.ClassDeclaration):
                return node.name
        except Exception:
            pass

        publicMatch = re.search(r"public\s+class\s+([A-Za-z_]\w*)", code)
        if publicMatch:
            return publicMatch.group(1)

        generalMatch = re.search(r"class\s+([A-Za-z_]\w*)", code)
        return generalMatch.group(1) if generalMatch else "Main"

    def resolveEntryName(self, code: str) -> str:
        if self.entryNamingStrategy == "className":
            return self.detectMainClassName(code)
        return "main"

    def resolveSourceFileName(self, code: str) -> str:
        extension = self.sourceExtension if self.sourceExtension.startswith(".") else f".{self.sourceExtension}"
        entryName = self.resolveEntryName(code)
        return f"{entryName}{extension}"

    def resolveTargetFileName(self, sourceFileName: str) -> str:
        if not self.targetExtension:
            return sourceFileName
        baseName = sourceFileName.rsplit(".", 1)[0]
        extension = self.targetExtension if self.targetExtension.startswith(".") else f".{self.targetExtension}"
        return f"{baseName}{extension}"
