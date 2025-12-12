from Domain.ValueObjects.SourceCode import SourceCode
from Domain.Entities.Results.ExecutionCodeResult import ExecutionCodeResult

class ExecutionCodeService:
    def __init__(self, compilerRegistry=None, executorRegistry=None, errorService=None):
        self.compilerRegistry = compilerRegistry
        self.executorRegistry = executorRegistry
        self.errorService = errorService

    def executeSource(self, statement, language, code, tests=None):
        sourceCode = SourceCode(code)
        compiler = self.compilerRegistry.get(language)
        if not compiler:
            return ExecutionCodeResult(False, "Compilador não registrado", [], [], 0.0, {})

        compilationResult = compiler.compile(sourceCode)
        if not compilationResult.isSuccess():
            if self.errorService:
                errorResult = self.errorService.analyzeError(statement, language, code, compilationResult.getMessage(), "compilation")
                return ExecutionCodeResult(False, errorResult.getMessage(), [], [], 0.0, {"error": errorResult.getErrorMessage()})
            return ExecutionCodeResult(False, compilationResult.getMessage(), [], [], 0.0, {})

        executor = self.executorRegistry.get(language)
        if not executor:
            return ExecutionCodeResult(False, "Executor não registrado", [], [], 0.0, {})

        executionResult = executor.execute(compilationResult.getSourcePath(), tests or [], timeout=10)
        if tests and executionResult.getOutputs():
            def _normalize(text): return str(text).replace("\r\n","\n").strip()
            results = []
            outputs = executionResult.getOutputs() or []
            for i, test in enumerate(tests):
                expected = _normalize(test.get("expected", ""))
                actual = _normalize(outputs[i]) if i < len(outputs) else ""
                passed = actual == expected
                results.append({"input": test.get("input",""), "expected": expected, "actual": actual, "passed": passed})
            matches = sum(1 for r in results if r["passed"])
            executionResult.rate = int((matches / len(tests)) * 100) if tests else 0
            executionResult.outputs = results

        if not executionResult.isSuccess() and self.errorService:
            errorResult = self.errorService.analyzeError(statement, language, code, executionResult.getMessage(), "execution")
            executionResult.message = errorResult.getMessage()
            executionResult.errorMessage = errorResult.getErrorMessage()
        
        return executionResult