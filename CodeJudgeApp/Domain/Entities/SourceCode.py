from dataclasses import dataclass
import re
import javalang

@dataclass(slots=True)
class SourceCode:
    code: str
    language: str
    extension: str = ""

    def detectMainClassName(self) -> str:
        try:
            tree = javalang.parse.parse(self.code)
            for _, node in tree.filter(javalang.tree.ClassDeclaration):
                if any(method.name == "main" for method in node.methods):
                    return node.name
            for _, node in tree.filter(javalang.tree.ClassDeclaration):
                if "public" in node.modifiers:
                    return node.name
            for _, node in tree.filter(javalang.tree.ClassDeclaration):
                return node.name
        except Exception:
            pass

        publicMatch = re.search(r"public\s+class\s+([A-Za-z_]\w*)", self.code)
        if publicMatch:
            return publicMatch.group(1)

        generalMatch = re.search(r"class\s+([A-Za-z_]\w*)", self.code)
        return generalMatch.group(1) if generalMatch else "Main"

    def isEmpty(self) -> bool:
        return not self.code or not self.code.strip()
