import importlib
import threading
from collections import OrderedDict
from typing import Optional, Tuple, Type
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Exceptions.DomainException import DomainException, MissingUserApiKeyException
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger

class EngineFactory:
    _classCache: dict[str, Type[IAiEngine]] = {}
    _adapterCache: "OrderedDict[Tuple[str, str, str, bool], IAiEngine]" = OrderedDict()
    _cacheLock = threading.Lock()
    _MAX_CACHE_SIZE = 32

    @classmethod
    def resolveAdapterClass(cls, classPath: str) -> Type[IAiEngine]:
        cached = cls._classCache.get(classPath)
        if cached is not None:
            return cached

        parts = classPath.rsplit(".", 1)
        if len(parts) != 2:
            raise DomainException(f"Invalid adapter class path: '{classPath}'. Expected format: 'package.module.ClassName'.")
        moduleName, className = parts
        try:
            module = importlib.import_module(moduleName)
            adapterClass = getattr(module, className)
            cls._classCache[classPath] = adapterClass
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

        resolvedEngineKey, resolvedModel = config.resolveEngineAndModel(
            requestedEngine=cleanEngine,
            requestedModel=cleanModel,
            hasUserApiKey=bool(cleanKey)
        )
        ignoreServerKey = bool(userKeyRequired or cleanKey)
        cacheKey = (resolvedEngineKey, resolvedModel, cleanKey, ignoreServerKey)

        with cls._cacheLock:
            cachedEngine = cls._adapterCache.get(cacheKey)
            if cachedEngine is not None:
                cls._adapterCache.move_to_end(cacheKey)
                return cachedEngine

        engineConfig = config.getEngineConfig(resolvedEngineKey)
        adapterIdentifier = engineConfig.get("adapter")
        if not adapterIdentifier:
            raise DomainException(f"AI engine '{resolvedEngineKey}' has no 'adapter' property defined in Configuration.json.")

        adaptersMap = config.getAiAdapters()
        adapterClassPath = adaptersMap.get(adapterIdentifier, adapterIdentifier)
        adapterClass = cls.resolveAdapterClass(adapterClassPath)

        args = dict(engineConfig.get("args", {}))
        args["model"] = resolvedModel

        if ignoreServerKey:
            args["apiKey"] = cleanKey
            args["ignoreServerKey"] = True

        instance = adapterClass(args)

        with cls._cacheLock:
            cls._adapterCache[cacheKey] = instance
            cls._adapterCache.move_to_end(cacheKey)
            while len(cls._adapterCache) > cls._MAX_CACHE_SIZE:
                cls._adapterCache.popitem(last=False)

        return instance
