class AnalysisCodeController:
    def __init__(self, analysisService=None):
        self.analysisService = analysisService

    def analyze(self, statement, language, code):
        return self.analysisService.analyzeSource(statement, language, code)
