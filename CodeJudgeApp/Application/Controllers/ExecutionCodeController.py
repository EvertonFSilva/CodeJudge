class ExecutionCodeController:
    def __init__(self, executionService=None):
        self.executionService = executionService

    def execute(self, language, code, tests=None):
        return self.executionService.execute(language, code, tests)
