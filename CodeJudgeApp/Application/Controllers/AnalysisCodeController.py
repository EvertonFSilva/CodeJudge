class AnalysisCodeController:
    def __init__(self, analysisService=None):
        self.analysisService = analysisService

    def analyze(self, language, code):
        return self.analysisService.analyzeSource(language, code)
