class OptimizationCodeController:
    def __init__(self, optimizationService=None):
        self.optimizationService = optimizationService

    def optimize(self, language, code):
        return self.optimizationService.optimizeSource(language, code)
