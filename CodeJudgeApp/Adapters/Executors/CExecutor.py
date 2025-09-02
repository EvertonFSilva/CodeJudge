import subprocess
import os
from Core.Base.ExecutorBase import ExecutorBase
from Domain.Entities.Results.ExecutionCodeResult import ExecutionCodeResult

class CExecutor(ExecutorBase):
    def __init__(self, settings=None):
        super().__init__(settings or {})

    def execute(self, sourcePath, tests=None, timeout=60):
        try:
            if not os.path.isfile(sourcePath):
                return ExecutionCodeResult(False, "Nenhum executável C encontrado", [], [], 0.0, {})

            outputs, inputsList = [], []

            if tests:
                for test in tests:
                    inp = test.get("input", "")
                    proc = subprocess.Popen(
                        [sourcePath],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    out, err = proc.communicate(input=(inp + "\n").encode("utf-8"), timeout=timeout)
                    outputText = (out.decode("utf-8") if out else "").strip()
                    errText = (err.decode("utf-8") if err else "").strip()

                    if proc.returncode != 0 or errText:
                        return ExecutionCodeResult(False, f"Erro de execução: {errText}" if errText else "Erro de execução", inputsList, outputs, 0.0, {})

                    outputs.append(outputText)
                    inputsList.append(inp)

            else:
                proc = subprocess.Popen(
                    [sourcePath],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                out, err = proc.communicate(input="\n".encode("utf-8"), timeout=timeout)
                outputText = (out.decode("utf-8") if out else "").strip()
                errText = (err.decode("utf-8") if err else "").strip()

                if proc.returncode != 0 or errText:
                    return ExecutionCodeResult(False, f"Erro de execução: {errText}" if errText else "Erro de execução", [], [outputText], 0.0, {})

                outputs.append(outputText)

            return ExecutionCodeResult(True, "Execução finalizada", inputsList, outputs, 0.0, {})

        except Exception as exc:
            return ExecutionCodeResult(False, f"Erro de execução: {str(exc)}", [], [], 0.0, {})
