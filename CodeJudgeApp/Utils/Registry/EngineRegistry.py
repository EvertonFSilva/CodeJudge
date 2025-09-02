import importlib

class EngineRegistry:
    def __init__(self, configurationManager=None):
        self.configurationManager = configurationManager
        self.engines = {}
        self.defaultKey = self.configurationManager.get("ai.default")
        self._loadFromConfig()

    def _loadFromConfig(self):
        enginesCfg = self.configurationManager.get("ai.engines", {}) or {}
        for key, cfg in enginesCfg.items():
            modulePath = cfg.get("module"); className = cfg.get("class"); args = cfg.get("args", {})
            try:
                module = importlib.import_module(modulePath)
                cls = getattr(module, className)
                instance = cls(args)
                self.engines[key.lower()] = instance
            except Exception:
                pass

    def get(self, key=None):
        if not key:
            key = self.defaultKey
        if not key:
            return None
        return self.engines.get(str(key).lower())

    def getDefault(self):
        return self.get(None)
