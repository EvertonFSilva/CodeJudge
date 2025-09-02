from Domain.Entities.Results.BaseCodeResult import BaseCodeResult

class CompilationCodeResult(BaseCodeResult):
    def __init__(self, success, message, sourcePath=None, logs=None):
        super().__init__(success, message)
        self.sourcePath = sourcePath
        self.logs = logs or ""

    def getSourcePath(self):
        return self.sourcePath

    def getLogs(self):
        return self.logs
