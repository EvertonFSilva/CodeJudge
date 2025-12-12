class ExecutionCodeController:
    def __init__(self, executionService=None):
        self.executionService = executionService

    def execute(self, statement, language, code, tests=None):
        return self.executionService.executeSource(statement, language, code, tests)
