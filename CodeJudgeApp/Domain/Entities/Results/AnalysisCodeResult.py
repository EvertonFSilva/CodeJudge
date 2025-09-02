from Domain.Entities.Results.BaseCodeResult import BaseCodeResult

class AnalysisCodeResult(BaseCodeResult):
    def __init__(self, success, message):
        super().__init__(success, message)
