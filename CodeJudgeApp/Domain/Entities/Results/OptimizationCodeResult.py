from Domain.Entities.Results.BaseCodeResult import BaseCodeResult

class OptimizationCodeResult(BaseCodeResult):
    def __init__(self, success, message):
        super().__init__(success, message)
