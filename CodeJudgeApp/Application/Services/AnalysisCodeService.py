from Domain.Entities.Results.AnalysisCodeResult import AnalysisCodeResult

class AnalysisCodeService:
    def __init__(self, engineRegistry=None, promptManager=None):
        self.engineRegistry = engineRegistry
        self.promptManager = promptManager

    def analyzeSource(self, language, code):
        engine = self.engineRegistry.get(language)
        if not engine:
            engine = self.engineRegistry.getDefault()

        templates = self.promptManager.getAllPrompts("analysis")
        responses = []

        for template in templates:
            prompt = template + "\n" + language + "\n" + code
            responseText = engine.complete(prompt, {})
            if responseText:
                responses.append(responseText)

        finalResponse = "\n\n---\n\n".join(responses)
        return AnalysisCodeResult(True, finalResponse)
