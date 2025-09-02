import importlib

class ExecutorRegistry:
    def __init__(self, configurationManager=None):
        self.configurationManager = configurationManager
        self.executors = {}
        self._loadFromConfig()

    def _loadFromConfig(self):
        executorsCfg = self.configurationManager.get("executors.languages", {}) or {}
        for key, cfg in executorsCfg.items():
            modulePath = cfg.get("module"); className = cfg.get("class"); args = cfg.get("args", {})
            try:
                module = importlib.import_module(modulePath)
                cls = getattr(module, className)
                instance = cls(args)
                self.executors[key.lower()] = instance
            except Exception:
                pass

    def get(self, languageKey):
        if not languageKey:
            return None
        return self.executors.get(str(languageKey).lower())
