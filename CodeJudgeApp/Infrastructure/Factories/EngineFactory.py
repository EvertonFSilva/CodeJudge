import importlib
from typing import Optional, Type
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Exceptions.DomainException import DomainException, MissingUserApiKeyException
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger

class EngineFactory:
    @classmethod
    def resolveAdapterClass(cls, classPath: str) -> Type[IAiEngine]:
        parts = classPath.rsplit(".", 1)
        if len(parts) != 2:
            raise DomainException(f"Invalid adapter class path: '{classPath}'. Expected format: 'package.module.ClassName'.")
        moduleName, className = parts
        try:
            module = importlib.import_module(moduleName)
            adapterClass = getattr(module, className)
            return adapterClass
        except (ImportError, AttributeError) as exc:
            raise DomainException(f"Failed to load AI adapter class '{classPath}': {str(exc)}")

    @classmethod
    def create(cls, config: ConfigurationManager) -> IAiEngine:
        logger = Logger.get()
        engineConfig = config.getDefaultEngineConfig()
        defaultEngineName = config.getDefaultEngineName()

        adapterIdentifier = engineConfig.get("adapter")
        if not adapterIdentifier:
            raise DomainException(f"AI engine '{defaultEngineName}' has no 'adapter' property defined in Configuration.json.")

        adaptersMap = config.getAiAdapters()
        adapterClassPath = adaptersMap.get(adapterIdentifier, adapterIdentifier)

        adapterClass = cls.resolveAdapterClass(adapterClassPath)
        args = dict(engineConfig.get("args", {}))

        if config.isUserKeyRequired():
            args["apiKey"] = ""
            args["ignoreServerKey"] = True
            logger.info(
                f"Instantiating AI engine '{defaultEngineName}' with 'isUserKeyRequired=True' (server key disabled)."
            )
        else:
            logger.info(f"Instantiating AI engine '{defaultEngineName}' using adapter '{adapterClassPath}'.")

        return adapterClass(args)

    @classmethod
    def resolveForRequest(
        cls,
        config: ConfigurationManager,
        fallbackEngine: IAiEngine,
        apiKey: Optional[str] = None,
        engine: Optional[str] = None,
        model: Optional[str] = None
    ) -> IAiEngine:
        userKeyRequired = config.isUserKeyRequired()
        cleanKey = (apiKey or "").strip()
        cleanEngine = (engine or "").strip() or None
        cleanModel = (model or "").strip() or None

        if userKeyRequired and not cleanKey:
            raise MissingUserApiKeyException()

        if not userKeyRequired and not cleanKey and not cleanEngine and not cleanModel:
            return fallbackEngine

        resolvedEngineKey, resolvedModel = config.resolveEngineAndModel(cleanEngine, cleanModel)
        engineConfig = config.getEngineConfig(resolvedEngineKey)

        adapterIdentifier = engineConfig.get("adapter")
        if not adapterIdentifier:
            raise DomainException(f"AI engine '{resolvedEngineKey}' has no 'adapter' property defined in Configuration.json.")

        adaptersMap = config.getAiAdapters()
        adapterClassPath = adaptersMap.get(adapterIdentifier, adapterIdentifier)
        adapterClass = cls.resolveAdapterClass(adapterClassPath)

        args = dict(engineConfig.get("args", {}))
        args["model"] = resolvedModel

        if userKeyRequired or cleanKey:
            args["apiKey"] = cleanKey
            args["ignoreServerKey"] = True

        return adapterClass(args)
