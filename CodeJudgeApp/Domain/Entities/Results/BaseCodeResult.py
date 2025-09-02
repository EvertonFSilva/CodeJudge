class BaseCodeResult:
    def __init__(self, success, message):
        self.success = bool(success)
        self.message = message

    def isSuccess(self):
        return self.success

    def getMessage(self):
        return self.message
