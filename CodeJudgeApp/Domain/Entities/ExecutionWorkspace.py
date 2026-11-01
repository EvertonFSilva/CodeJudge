import os
import shutil
import tempfile
from dataclasses import dataclass

@dataclass(slots=True)
class ExecutionWorkspace:
    path: str

    @classmethod
    def create(cls, prefix: str = "cj_sandbox_") -> "ExecutionWorkspace":
        directoryPath = tempfile.mkdtemp(prefix=prefix)
        return cls(path=directoryPath)

    @property
    def directory(self) -> str:
        return self.path

    def writeSource(self, fileName: str, content: str) -> str:
        filePath = os.path.join(self.path, fileName)
        with open(filePath, "w", encoding="utf-8") as file:
            file.write(content)
        return filePath

    def writeSourceFile(self, fileName: str, source) -> str:
        fullName = f"{fileName}{source.extension}" if not fileName.endswith(source.extension) else fileName
        return self.writeSource(fullName, source.code)

    def resolvePath(self, fileName: str) -> str:
        return os.path.join(self.path, fileName)

    def dispose(self):
        if os.path.isdir(self.path):
            shutil.rmtree(self.path, ignore_errors=True)

    def __enter__(self) -> "ExecutionWorkspace":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.dispose()
