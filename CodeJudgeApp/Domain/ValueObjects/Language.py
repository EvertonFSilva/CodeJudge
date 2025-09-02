from Utils.CodeUtils import deriveFileNameFromCode

class SourceCode:
    def __init__(self, code):
        self.code = code or ""
        self.fileName = deriveFileNameFromCode(self.code)

    def getCode(self):
        return self.code

    def getFileName(self):
        return self.fileName