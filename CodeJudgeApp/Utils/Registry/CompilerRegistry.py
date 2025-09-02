import importlib

class CompilerRegistry:
    def __init__(self, configurationManager=None):
        self.configurationManager = configurationManager
        self.compilers = {}
        self._loadFromConfig()

    def _loadFromConfig(self):
        compilersCfg = self.configurationManager.get("compilers.languages", {}) or {}
        for key, cfg in compilersCfg.items():
            modulePath = cfg.get("module"); className = cfg.get("class"); args = cfg.get("args", {})
            try:
                module = importlib.import_module(modulePath)
                cls = getattr(module, className)
                instance = cls(args)
                self.compilers[key.lower()] = instance
            except Exception:
                pass

    def get(self, languageKey):
        if not languageKey:
            return None
        return self.compilers.get(str(languageKey).lower())
