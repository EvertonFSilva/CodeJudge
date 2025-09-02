class EngineBase:
    def __init__(self, settings=None):
        self.settings = settings or {}

    def complete(self, prompt, params=None):
        raise NotImplementedError()
