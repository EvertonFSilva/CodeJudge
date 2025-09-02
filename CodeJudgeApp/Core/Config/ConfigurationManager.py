import json
import os
import importlib

class ConfigurationManager:
    def __init__(self, path=None):
        baseDirectory = os.path.dirname(os.path.abspath(__file__))
        defaultPath = os.path.join(baseDirectory, "Configuration.json")
        self.configPath = path or defaultPath
        with open(self.configPath, "r", encoding="utf-8") as fh:
            self.config = json.load(fh)

    def get(self, keyPath, default=None):
        parts = keyPath.split(".")
        node = self.config
        for part in parts:
            if isinstance(node, dict) and part in node:
                node = node[part]
            else:
                return default
        return node

    def instantiate(self, modulePath, className, args):
        module = importlib.import_module(modulePath)
        cls = getattr(module, className)
        return cls(args or {})
