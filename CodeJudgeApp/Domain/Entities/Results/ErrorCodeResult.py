from Domain.Entities.Results.BaseCodeResult import BaseCodeResult

class ErrorCodeResult(BaseCodeResult):
    def __init__(self, success, message, errorMessage=None):
        super().__init__(success, message)
        self.errorMessage = errorMessage or ""

    def getErrorMessage(self):
        return self.errorMessage