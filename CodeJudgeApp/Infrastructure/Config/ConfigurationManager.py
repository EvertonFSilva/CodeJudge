import os
import json
from pathlib import Path
from typing import Any, Dict, Optional
from Domain.Entities.Language import Language
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Exceptions.DomainException import DomainException

class ConfigurationManager(ILanguageRepository):
    _instance = None

    def __init__(self, configPath: Optional[str] = None):
        self.baseDirectory = Path(__file__).resolve().parent.parent.parent
        self.configPath = configPath or str(self.baseDirectory / "Configuration.json")
        self.settings: Dict[str, Any] = {}
        self.loadConfiguration()

    @classmethod
    def get(cls) -> "ConfigurationManager":
        if cls._instance is None:
            cls._instance = ConfigurationManager()
        return cls._instance

    def loadConfiguration(self):
        if os.path.isfile(self.configPath):
            try:
                with open(self.configPath, "r", encoding="utf-8") as file:
                    self.settings = json.load(file)
            except Exception:
                self.settings = {}

    def getSetting(self, keyPath: str, default: Any = None) -> Any:
        keys = keyPath.split(".")
        current = self.settings
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default
        return current

    def getAiAdapters(self) -> Dict[str, str]:
        return self.getSetting("ai.adapters", {})

    def getDefaultEngineName(self) -> str:
        defaultEngine = self.getSetting("ai.default")
        if not defaultEngine:
            raise DomainException("Property 'ai.default' is not configured in Configuration.json.")
        return str(defaultEngine)

    def getDefaultEngineConfig(self) -> Dict[str, Any]:
        defaultName = self.getDefaultEngineName()
        engineConfig = self.getSetting(f"ai.engines.{defaultName}")
        if not engineConfig:
            raise DomainException(f"Configuration for AI engine '{defaultName}' is missing in Configuration.json.")
        return engineConfig

    def getLanguagesRaw(self) -> Dict[str, Any]:
        return self.getSetting("languages", {})

    def getLanguage(self, language: str) -> Optional[Language]:
        key = language.strip().lower()
        languageConfig = self.getLanguagesRaw().get(key)
        if not languageConfig:
            return None

        compilerConfig = languageConfig.get("compiler", {})
        executorConfig = languageConfig.get("executor", {})

        return Language(
            key=key,
            name=languageConfig.get("name", key.upper()),
            sourceExtension=languageConfig.get("sourceExtension", f".{key}"),
            targetExtension=languageConfig.get("targetExtension", ""),
            entryNamingStrategy=languageConfig.get("entryNamingStrategy", "fixed"),
            compilerCommand=compilerConfig.get("command"),
            compilerArguments=compilerConfig.get("arguments", []),
            executorCommand=executorConfig.get("command", ""),
            executorArguments=executorConfig.get("arguments", [])
        )

    def getAllLanguages(self) -> Dict[str, Language]:
        rawLanguages = self.getLanguagesRaw()
        languages = {}
        for key in rawLanguages:
            lang = self.getLanguage(key)
            if lang:
                languages[key] = lang
        return languages

    def isLanguageSupported(self, language: str) -> bool:
        return self.getLanguage(language) is not None

    def getExecutionTimeout(self) -> int:
        return int(self.getSetting("execution.timeoutSeconds", 10))

    def getTemplatesDirectory(self) -> str:
        defaultPath = str(self.baseDirectory / "Infrastructure" / "Templates")
        configured = self.getSetting("templates.directory", defaultPath)
        return str(Path(self.baseDirectory / configured).resolve()) if configured.startswith(".") else configured
