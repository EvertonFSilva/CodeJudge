from Domain.Entities.Results.BaseCodeResult import BaseCodeResult

class ExecutionCodeResult(BaseCodeResult):
    def __init__(self, success, message, inputs=None, outputs=None, rate=0.0, details={}):
        super().__init__(success, message)
        self.inputs = inputs or []
        self.outputs = outputs or []
        self.rate = rate or 0.0
        self.details = details or {}

    def getInputs(self):
        return self.inputs

    def getOutputs(self):
        return self.outputs

    def getRate(self):
        return self.rate

    def getDetails(self):
        return self.details