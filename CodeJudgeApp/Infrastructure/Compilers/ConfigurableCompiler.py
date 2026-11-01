import os
import time
import subprocess
from Domain.Contracts.ICompiler import ICompiler
from Domain.Entities.SourceCode import SourceCode
from Domain.Entities.Language import Language
from Domain.Entities.ExecutionWorkspace import ExecutionWorkspace
from Domain.Reports.CompilationReport import CompilationReport
from Infrastructure.Logging.Logger import Logger

class ConfigurableCompiler(ICompiler):
    def __init__(self, language: Language):
        self.language = language
        self.logger = Logger.get()

    def compile(self, source: SourceCode) -> CompilationReport:
        startTime = time.time()
        workspace = ExecutionWorkspace.create(prefix=f"cj_{self.language.key}_")

        sourceFileName = self.language.resolveSourceFileName(source.code)
        sourcePath = workspace.writeSource(sourceFileName, source.code)
        targetFileName = self.language.resolveTargetFileName(sourceFileName)
        targetPath = workspace.resolvePath(targetFileName)
        entryClassName = self.language.detectMainClassName(source.code)

        if not self.language.needsCompilation():
            durationMs = round((time.time() - startTime) * 1000, 2)
            self.logger.info(f"Language '{self.language.name}' does not require compilation. Execution ready in {durationMs}ms.")
            return CompilationReport(
                success=True,
                message=f"{self.language.name} is an interpreted language and ready for direct execution.",
                binaryPath=sourcePath,
                logs="",
                durationMs=durationMs,
                workspaceDirectory=workspace.path
            )

        formattedArgs = []
        for arg in self.language.compilerArguments:
            replaced = (
                arg.replace("{source}", sourcePath)
                .replace("{target}", targetPath)
                .replace("{workspace}", workspace.path)
                .replace("{entryClass}", entryClassName)
            )
            formattedArgs.append(replaced)

        command = [self.language.compilerCommand] + formattedArgs
        self.logger.info(f"Executing compilation for '{self.language.name}': {' '.join(command)} in workspace '{workspace.path}'.")

        try:
            process = subprocess.Popen(
                command,
                cwd=workspace.path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()
            durationMs = round((time.time() - startTime) * 1000, 2)

            if process.returncode != 0:
                combinedLogs = (stderr or stdout or "Unknown compilation error").strip()
                self.logger.warning(f"Compilation failed for '{self.language.name}' with exit code {process.returncode}. Logs: {combinedLogs[:200]}")
                return CompilationReport(
                    success=False,
                    message=f"Failed to compile {self.language.name} source code.",
                    binaryPath=None,
                    logs=combinedLogs,
                    durationMs=durationMs,
                    workspaceDirectory=workspace.path
                )

            effectiveBinaryPath = targetPath if os.path.exists(targetPath) else workspace.path
            self.logger.info(f"Compilation for '{self.language.name}' succeeded in {durationMs}ms. Target: '{effectiveBinaryPath}'.")
            return CompilationReport(
                success=True,
                message=f"{self.language.name} compilation completed successfully.",
                binaryPath=effectiveBinaryPath,
                logs=(stdout or "").strip(),
                durationMs=durationMs,
                workspaceDirectory=workspace.path
            )

        except FileNotFoundError as error:
            durationMs = round((time.time() - startTime) * 1000, 2)
            cmdName = command[0] if command else self.language.compilerCommand
            errMsg = f"Compilador '{cmdName}' não foi encontrado no sistema (PATH). Verifique se o compilador para {self.language.name} está instalado no seu ambiente."
            self.logger.error(f"Compiler executable '{cmdName}' not found for '{self.language.name}': {str(error)}")
            return CompilationReport(
                success=False,
                message=errMsg,
                binaryPath=None,
                logs=f"[WinError 2 / FileNotFoundError] O executável '{cmdName}' não está instalado ou não está no PATH do sistema.",
                durationMs=durationMs,
                workspaceDirectory=workspace.path
            )
        except Exception as error:
            durationMs = round((time.time() - startTime) * 1000, 2)
            self.logger.error(f"Internal compiler failure for '{self.language.name}': {str(error)}", error)
            return CompilationReport(
                success=False,
                message=f"Error executing compiler for {self.language.name}: {str(error)}",
                binaryPath=None,
                logs=str(error),
                durationMs=durationMs,
                workspaceDirectory=workspace.path
            )
