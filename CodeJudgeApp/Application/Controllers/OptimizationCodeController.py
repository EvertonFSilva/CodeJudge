class OptimizationCodeController:
    def __init__(self, optimizationService=None):
        self.optimizationService = optimizationService

    def optimize(self, statement, language, code):
        return self.optimizationService.optimizeSource(statement, language, code)
