import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from Domain.Entities.Language import Language
from Domain.Entities.AiModelProvider import AiModelProvider
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Contracts.IAiProviderRepository import IAiProviderRepository
from Domain.Exceptions.DomainException import (
    DomainException,
    UnsupportedAiEngineException,
    UnsupportedAiModelException
)

class ConfigurationManager(ILanguageRepository, IAiProviderRepository):
    _instance = None

    def __init__(self, configPath: Optional[str] = None):
        self.baseDirectory = Path(__file__).resolve().parent.parent.parent
        self.configPath = configPath or str(self.baseDirectory / "Configuration.json")
        self.settings: Dict[str, Any] = {}
        self._languagesCache: Optional[Dict[str, Language]] = None
        self._providersCache: Optional[Dict[str, AiModelProvider]] = None
        self.loadConfiguration()

    @classmethod
    def get(cls) -> "ConfigurationManager":
        if cls._instance is None:
            cls._instance = ConfigurationManager()
        return cls._instance

    def loadConfiguration(self):
        self._languagesCache = None
        self._providersCache = None
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

    def isUserKeyRequired(self) -> bool:
        val = self.getSetting("ai.isUserKeyRequired")
        if val is None:
            val = self.getSetting("ai.isApiKeyRequired")
        if val is None:
            val = self.getSetting("ai.requireUserKey", False)
        return bool(val)

    def getAiAdapters(self) -> Dict[str, str]:
        return self.getSetting("ai.adapters", {})

    def getAiEnginesRaw(self) -> Dict[str, Any]:
        return self.getSetting("ai.engines", {})

    def getDefaultEngineName(self) -> str:
        defaultEngine = self.getSetting("ai.default")
        if not defaultEngine:
            raise DomainException("Property 'ai.default' is not configured in Configuration.json.")
        return str(defaultEngine)

    def getEngineConfig(self, engineName: Optional[str] = None) -> Dict[str, Any]:
        targetName = (engineName or self.getDefaultEngineName()).strip().lower()
        engines = self.getAiEnginesRaw()
        engineConfig = engines.get(targetName)
        if not engineConfig:
            raise UnsupportedAiEngineException(targetName, list(engines.keys()))
        return engineConfig

    def getDefaultEngineConfig(self) -> Dict[str, Any]:
        defaultName = self.getDefaultEngineName()
        engineConfig = self.getSetting(f"ai.engines.{defaultName}")
        if not engineConfig:
            raise DomainException(f"Configuration for AI engine '{defaultName}' is missing in Configuration.json.")
        return engineConfig

    def _buildAiProvider(self, engineKey: str) -> Optional[AiModelProvider]:
        key = engineKey.strip().lower()
        rawEngines = self.getAiEnginesRaw()
        engineCfg = rawEngines.get(key)
        if not engineCfg or not isinstance(engineCfg, dict):
            return None

        args = engineCfg.get("args", {})
        defaultModel = str(args.get("model", "")).strip()
        rawSupported = engineCfg.get("supportedModels", engineCfg.get("models", []))

        supportedModels: List[str] = []
        seen = set()
        if isinstance(rawSupported, list):
            for item in rawSupported:
                modelStr = str(item).strip()
                if modelStr and modelStr not in seen:
                    seen.add(modelStr)
                    supportedModels.append(modelStr)

        if defaultModel and defaultModel not in seen:
            supportedModels.insert(0, defaultModel)

        defaultEngineName = self.getDefaultEngineName().strip().lower()
        requiresApiKey = bool(engineCfg.get("requiresApiKey", "ollama" not in key))

        return AiModelProvider(
            key=key,
            name=str(engineCfg.get("name", key.capitalize())),
            adapter=str(engineCfg.get("adapter", "")),
            defaultModel=defaultModel,
            supportedModels=supportedModels,
            requiresApiKey=requiresApiKey,
            isDefault=(key == defaultEngineName)
        )

    def getAiProvider(self, engineKey: str) -> Optional[AiModelProvider]:
        key = engineKey.strip().lower()
        return self.getAllAiProviders().get(key)

    def getAllAiProviders(self) -> Dict[str, AiModelProvider]:
        if self._providersCache is not None:
            return self._providersCache
        rawEngines = self.getAiEnginesRaw()
        providers: Dict[str, AiModelProvider] = {}
        for key in rawEngines:
            provider = self._buildAiProvider(key)
            if provider:
                providers[key.strip().lower()] = provider
        self._providersCache = providers
        return providers

    def getSupportedModels(self, engineKey: Optional[str] = None) -> List[str]:
        if engineKey:
            provider = self.getAiProvider(engineKey)
            if not provider:
                raise UnsupportedAiEngineException(engineKey, list(self.getAllAiProviders().keys()))
            return list(provider.supportedModels)

        allModels: List[str] = []
        seen = set()
        for provider in self.getAllAiProviders().values():
            for model in provider.supportedModels:
                if model not in seen:
                    seen.add(model)
                    allModels.append(model)
        return allModels

    def resolveEngineAndModel(
        self,
        requestedEngine: Optional[str] = None,
        requestedModel: Optional[str] = None,
        hasUserApiKey: bool = False
    ) -> Tuple[str, str]:
        providers = self.getAllAiProviders()
        supportedKeys = list(providers.keys())

        cleanEngine = requestedEngine.strip().lower() if requestedEngine and requestedEngine.strip() else None
        cleanModel = requestedModel.strip() if requestedModel and requestedModel.strip() else None

        if cleanEngine:
            provider = providers.get(cleanEngine)
            if not provider:
                raise UnsupportedAiEngineException(cleanEngine, supportedKeys)
            if cleanModel:
                if cleanModel not in provider.supportedModels:
                    raise UnsupportedAiModelException(cleanModel, cleanEngine, provider.supportedModels)
                return (cleanEngine, cleanModel)
            return (cleanEngine, provider.defaultModel)

        if cleanModel:
            defaultKey = self.getDefaultEngineName().strip().lower()
            defaultProvider = providers.get(defaultKey)
            if defaultProvider and cleanModel in defaultProvider.supportedModels:
                return (defaultKey, cleanModel)

            for key, provider in providers.items():
                if cleanModel in provider.supportedModels:
                    return (key, cleanModel)

            raise UnsupportedAiModelException(cleanModel, "all", self.getSupportedModels())

        defaultKey = self.getDefaultEngineName().strip().lower()
        defaultProvider = providers.get(defaultKey)
        if not defaultProvider:
            raise UnsupportedAiEngineException(defaultKey, supportedKeys)

        if (hasUserApiKey or self.isUserKeyRequired()) and not defaultProvider.requiresApiKey:
            for key, provider in providers.items():
                if provider.requiresApiKey:
                    return (key, provider.defaultModel)

        return (defaultKey, defaultProvider.defaultModel)

    def getLanguagesRaw(self) -> Dict[str, Any]:
        return self.getSetting("languages", {})

    def _buildLanguage(self, language: str) -> Optional[Language]:
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

    def getLanguage(self, language: str) -> Optional[Language]:
        key = language.strip().lower()
        return self.getAllLanguages().get(key)

    def getAllLanguages(self) -> Dict[str, Language]:
        if self._languagesCache is not None:
            return self._languagesCache
        rawLanguages = self.getLanguagesRaw()
        languages: Dict[str, Language] = {}
        for key in rawLanguages:
            lang = self._buildLanguage(key)
            if lang:
                languages[key.strip().lower()] = lang
        self._languagesCache = languages
        return languages

    def isLanguageSupported(self, language: str) -> bool:
        return self.getLanguage(language) is not None

    def getExecutionTimeout(self) -> int:
        return int(self.getSetting("execution.timeoutSeconds", 10))

    def getTemplatesDirectory(self) -> str:
        defaultPath = str(self.baseDirectory / "Infrastructure" / "Templates")
        configured = self.getSetting("templates.directory", defaultPath)
        return str(Path(self.baseDirectory / configured).resolve()) if configured.startswith(".") else configured
