import subprocess
import tempfile
import os
from Core.Base.CompilerBase import CompilerBase
from Domain.Entities.Results.CompilationCodeResult import CompilationCodeResult

class CCompiler(CompilerBase):
    def __init__(self, settings=None):
        super().__init__(settings or {})
        self.compilerPath = self.settings.get("compilerPath", "gcc")

    def compile(self, sourceCode):
        tempDir = tempfile.mkdtemp(prefix="cj_c_")
        sourceFileName = sourceCode.getFileName()
        sourcePath = os.path.join(tempDir, sourceFileName)
        executablePath = os.path.join(tempDir, "program.exe")
        with open(sourcePath, "w", encoding="utf-8") as writer:
            writer.write(sourceCode.getCode())
        proc = subprocess.Popen([self.compilerPath, sourcePath, "-o", executablePath], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proc.communicate()
        success = proc.returncode == 0
        logs = ""
        if stdout:
            logs = logs + stdout.decode("utf-8")
        if stderr:
            logs = logs + stderr.decode("utf-8")
        if success:
            return CompilationCodeResult(True, "Compilação bem-sucedida", executablePath, logs)
        return CompilationCodeResult(False, "Compilação falhou", None, logs)