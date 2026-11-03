import shutil
import subprocess
from typing import Dict, Any
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger

class HealthUseCase:
    def __init__(
        self,
        aiEngine: IAiEngine,
        languageRepository: ILanguageRepository,
        configManager: ConfigurationManager
    ):
        self.aiEngine = aiEngine
        self.languageRepository = languageRepository
        self.configManager = configManager
        self.logger = Logger.get()

    def check(self) -> Dict[str, Any]:
        languages = self.languageRepository.getAllLanguages()
        compilersStatus: Dict[str, Any] = {}
        allLanguagesAvailable = True

        for key, language in languages.items():
            compilerAvailable = True
            if language.needsCompilation():
                compilerAvailable = self.isExecutableAvailable(language.compilerCommand)

            runnerAvailable = True
            if language.executorCommand and not language.executorCommand.startswith("{"):
                runnerAvailable = self.isExecutableAvailable(language.executorCommand)

            isAvailable = compilerAvailable and runnerAvailable
            if not isAvailable:
                allLanguagesAvailable = False

            languageInfo: Dict[str, Any] = {
                "path": language.compilerCommand or "",
                "runner": language.executorCommand,
                "available": isAvailable
            }

            if language.compilerCommand and not language.compilerCommand.startswith("{"):
                languageInfo[f"{language.compilerCommand}Path"] = language.compilerCommand
            if language.executorCommand and not language.executorCommand.startswith("{"):
                languageInfo[f"{language.executorCommand}Path"] = language.executorCommand

            compilersStatus[key] = languageInfo

        userKeyRequired = self.configManager.isUserKeyRequired()
        aiAvailable = True if userKeyRequired else self.aiEngine.isAvailable()
        engineName = self.configManager.getDefaultEngineName()
        engineConfig = self.configManager.getDefaultEngineConfig()
        engineArgs = engineConfig.get("args", {})
        modelName = str(engineArgs.get("model", "unknown"))
        supportedModels = self.configManager.getSupportedModels(engineName)

        overallStatus = "healthy" if (allLanguagesAvailable and aiAvailable) else "warning"

        statusReport = {
            "status": overallStatus,
            "compilers": compilersStatus,
            "ai": {
                "engine": engineName,
                "provider": engineName,
                "available": aiAvailable,
                "model": modelName,
                "isUserKeyRequired": userKeyRequired,
                "supportedModels": supportedModels
            }
        }

        self.logger.info(
            f"Health check executed: status={overallStatus}, engine={engineName}, aiAvailable={aiAvailable}, isUserKeyRequired={userKeyRequired}."
        )
        return statusReport

    def isExecutableAvailable(self, executable: str) -> bool:
        if not executable:
            return False
        if shutil.which(executable):
            return True
        try:
            result = subprocess.run([executable, "--version"], capture_output=True, timeout=2)
            return result.returncode == 0
        except Exception:
            return False
