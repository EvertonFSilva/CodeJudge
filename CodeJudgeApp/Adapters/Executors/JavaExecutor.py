import subprocess
import os
import re
from Core.Base.ExecutorBase import ExecutorBase
from Domain.Entities.Results.ExecutionCodeResult import ExecutionCodeResult

class JavaExecutor(ExecutorBase):
    def __init__(self, settings=None):
        super().__init__(settings or {})

    def _findMainClass(self, path):
        files = [f for f in os.listdir(path) if f.endswith(".class") or f.endswith(".java")]
        for f in files:
            match = re.match(r'([A-Za-z_]\w*)', f)
            if match:
                return match.group(1)
        return "Main"

    def execute(self, sourcePath, tests=None, timeout=10):
        try:
            mainClass = self._findMainClass(sourcePath)
            outputs = []
            inputsList = []

            if tests:
                for test in tests:
                    inp = test.get("input", "")
                    proc = subprocess.run(
                        ["java", "-cp", sourcePath, mainClass],
                        input=inp + "\n",
                        text=True,
                        capture_output=True,
                        timeout=timeout
                    )
                    text = proc.stdout.strip()
                    stderr = proc.stderr.strip()

                    if proc.returncode != 0 or stderr:
                        return ExecutionCodeResult(False, f"Erro de execução: {stderr}" if stderr else "Erro de execução", inputsList, outputs, 0.0, {})

                    outputs.append(text)
                    inputsList.append(inp)

                return ExecutionCodeResult(True, "Execução finalizada", inputsList, outputs, 0.0, {})

            else:
                proc = subprocess.run(
                    ["java", "-cp", sourcePath, mainClass],
                    input="",
                    text=True,
                    capture_output=True,
                    timeout=timeout
                )
                text = proc.stdout.strip()
                stderr = proc.stderr.strip()

                if proc.returncode != 0 or stderr:
                    return ExecutionCodeResult(False, f"Erro de execução: {stderr}" if stderr else "Erro de execução", [], [text], 0.0, {})

                return ExecutionCodeResult(True, "Execução finalizada", [], [text], 0.0, {})

        except Exception as exc:
            return ExecutionCodeResult(False, f"Erro de execução: {str(exc)}", [], [], 0.0, {})