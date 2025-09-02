class ExecutorBase:
    def __init__(self, settings=None):
        self.settings = settings or {}

    def execute(self, sourcePath, tests=None, timeout=5):
        raise NotImplementedError()
