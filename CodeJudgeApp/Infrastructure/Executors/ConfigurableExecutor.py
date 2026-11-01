import os
import time
import subprocess
from dataclasses import asdict
from typing import List, Optional
from Domain.Contracts.IExecutor import IExecutor
from Domain.Entities.Language import Language
from Domain.Entities.TestScenario import TestScenario
from Domain.Entities.ScenarioOutcome import ScenarioOutcome
from Domain.Entities.ExecutionMetrics import ExecutionMetrics
from Domain.Reports.ExecutionReport import ExecutionReport
from Infrastructure.Logging.Logger import Logger

class ConfigurableExecutor(IExecutor):
    def __init__(self, language: Language):
        self.language = language
        self.logger = Logger.get()

    def detectEntryClassName(self, workspaceDirectory: str) -> str:
        if not os.path.isdir(workspaceDirectory):
            return "Main"

        files = os.listdir(workspaceDirectory)
        classFiles = [f for f in files if f.endswith(".class")]
        for classFile in classFiles:
            className = classFile[:-6]
            if className != "package-info":
                return className

        sourceFiles = [f for f in files if f.endswith(self.language.sourceExtension)]
        for sourceFile in sourceFiles:
            return sourceFile.rsplit(".", 1)[0]

        return "Main"

    def buildExecutionCommandLine(self, targetPath: str, workspaceDirectory: str) -> List[str]:
        entryClassName = self.detectEntryClassName(workspaceDirectory)
        formattedArguments = []

        for argument in self.language.executorArguments:
            replaced = (
                argument.replace("{target}", targetPath)
                .replace("{workspace}", workspaceDirectory)
                .replace("{entryClass}", entryClassName)
                .replace("{source}", targetPath)
            )
            formattedArguments.append(replaced)

        commandExecutable = self.language.executorCommand.replace("{target}", targetPath)
        return [commandExecutable] + formattedArguments

    def execute(
        self,
        targetPath: str,
        scenarios: Optional[List[TestScenario]] = None,
        timeoutSeconds: int = 10
    ) -> ExecutionReport:
        startTime = time.time()
        workspaceDirectory = targetPath if os.path.isdir(targetPath) else os.path.dirname(targetPath)

        command = self.buildExecutionCommandLine(targetPath, workspaceDirectory)
        self.logger.info(f"Executing program for '{self.language.name}': {' '.join(command)} (timeout: {timeoutSeconds}s).")

        try:
            if scenarios and len(scenarios) > 0:
                outcomes: List[ScenarioOutcome] = []
                inputEchoList = []

                for index, scenario in enumerate(scenarios):
                    inputPayload = scenario.input if scenario.input.endswith("\n") else f"{scenario.input}\n"
                    inputEchoList.append(scenario.input)

                    process = subprocess.Popen(
                        command,
                        cwd=workspaceDirectory,
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )

                    try:
                        stdout, stderr = process.communicate(input=inputPayload, timeout=timeoutSeconds)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        self.logger.warning(f"Scenario #{index + 1} timed out after {timeoutSeconds}s.")
                        outcomes.append(ScenarioOutcome(
                            input=scenario.input,
                            expected=scenario.expected,
                            actual=f"Execution timed out ({timeoutSeconds}s limit).",
                            passed=False
                        ))
                        continue

                    actualOutput = (stdout or "").strip()
                    errorOutput = (stderr or "").strip()

                    if process.returncode != 0:
                        errorMessage = f"Execution error (exit code {process.returncode}): {errorOutput}" if errorOutput else f"Execution error (exit code {process.returncode})"
                        actualOutput = errorMessage

                    trimmedActual = actualOutput.replace("\r\n", "\n").strip()
                    trimmedExpected = str(scenario.expected).replace("\r\n", "\n").strip()
                    passed = (process.returncode == 0) and (trimmedActual == trimmedExpected)

                    outcomes.append(ScenarioOutcome(
                        input=scenario.input,
                        expected=scenario.expected,
                        actual=actualOutput,
                        passed=passed
                    ))

                passedTotal = sum(1 for item in outcomes if item.passed)
                metrics = ExecutionMetrics.calculate(len(scenarios), passedTotal)
                durationMs = round((time.time() - startTime) * 1000, 2)
                serializedOutcomes = [asdict(item) for item in outcomes]

                self.logger.info(f"Test scenarios for '{self.language.name}' finished: {passedTotal}/{len(scenarios)} passed ({metrics.successRate}%) in {durationMs}ms.")
                return ExecutionReport(
                    success=metrics.allPassed,
                    message=f"Execution completed with {passedTotal} of {len(scenarios)} tests passed ({metrics.successRate}%).",
                    inputs=inputEchoList,
                    outputs=serializedOutcomes,
                    rate=metrics.successRate,
                    details={"total": len(scenarios), "passed": passedTotal},
                    durationMs=durationMs
                )

            else:
                process = subprocess.Popen(
                    command,
                    cwd=workspaceDirectory,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                try:
                    stdout, stderr = process.communicate(input="", timeout=timeoutSeconds)
                except subprocess.TimeoutExpired:
                    process.kill()
                    durationMs = round((time.time() - startTime) * 1000, 2)
                    self.logger.warning(f"Free execution for '{self.language.name}' timed out after {timeoutSeconds}s.")
                    return ExecutionReport(
                        success=False,
                        message=f"Execution timed out ({timeoutSeconds}s limit).",
                        inputs=[],
                        outputs=["Execution timed out."],
                        rate=None,
                        details={"error": "TimeoutExpired"},
                        rawOutput="Execution timed out.",
                        durationMs=durationMs
                    )

                durationMs = round((time.time() - startTime) * 1000, 2)
                rawStdout = (stdout or "").strip()
                rawStderr = (stderr or "").strip()

                if process.returncode != 0:
                    combinedError = rawStderr if rawStderr else rawStdout
                    self.logger.warning(f"Free execution for '{self.language.name}' exited with error code {process.returncode}.")
                    return ExecutionReport(
                        success=False,
                        message=f"Program exited with code {process.returncode}: {combinedError}",
                        inputs=[],
                        outputs=[combinedError],
                        rate=None,
                        details={"exitCode": process.returncode},
                        rawOutput=combinedError,
                        durationMs=durationMs
                    )

                self.logger.info(f"Free execution for '{self.language.name}' succeeded in {durationMs}ms.")
                return ExecutionReport(
                    success=True,
                    message=f"{self.language.name} program executed successfully.",
                    inputs=[],
                    outputs=[rawStdout],
                    rate=None,
                    details={},
                    rawOutput=rawStdout,
                    durationMs=durationMs
                )

        except Exception as error:
            durationMs = round((time.time() - startTime) * 1000, 2)
            self.logger.error(f"Execution process failure for '{self.language.name}': {str(error)}", error)
            return ExecutionReport(
                success=False,
                message=f"Failed to execute program: {str(error)}",
                inputs=[],
                outputs=[str(error)],
                rate=None,
                details={"error": str(error)},
                rawOutput=str(error),
                durationMs=durationMs
            )
