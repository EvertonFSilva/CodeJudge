import importlib
from typing import Type
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Exceptions.DomainException import DomainException
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
        args = engineConfig.get("args", {})

        logger.info(f"Instantiating AI engine '{defaultEngineName}' using adapter '{adapterClassPath}'.")
        return adapterClass(args)
