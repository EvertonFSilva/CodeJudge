class CompilerBase:
    def __init__(self, settings=None):
        self.settings = settings or {}

    def compile(self, sourceCode):
        raise NotImplementedError()
