import subprocess
import tempfile
import os
import re
from Core.Base.CompilerBase import CompilerBase
from Domain.Entities.Results.CompilationCodeResult import CompilationCodeResult

class JavaCompiler(CompilerBase):
    def __init__(self, settings=None):
        super().__init__(settings or {})
        self.compilerPath = self.settings.get("compilerPath", "javac")

    def _extractClassName(self, code):
        match = re.search(r'class\s+([A-Za-z_]\w*)', code)
        if match:
            return match.group(1)
        return "Main"

    def compile(self, sourceCode):
        tempDir = tempfile.mkdtemp(prefix="cj_java_")
        className = self._extractClassName(sourceCode.getCode())
        sourceFileName = className + ".java"
        sourcePath = os.path.join(tempDir, sourceFileName)
        with open(sourcePath, "w", encoding="utf-8") as writer:
            writer.write(sourceCode.getCode())
        proc = subprocess.Popen([self.compilerPath, sourcePath], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proc.communicate()
        success = proc.returncode == 0
        logs = ""
        if stdout:
            logs = logs + stdout.decode("utf-8")
        if stderr:
            logs = logs + stderr.decode("utf-8")
        if success:
            return CompilationCodeResult(True, "Compilação bem-sucedida", tempDir, logs)
        return CompilationCodeResult(False, "Compilação falhou", None, logs)
