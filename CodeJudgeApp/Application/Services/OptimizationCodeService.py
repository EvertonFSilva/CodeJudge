from Domain.Entities.Results.OptimizationCodeResult import OptimizationCodeResult

class OptimizationCodeService:
    def __init__(self, engineRegistry=None, promptManager=None):
        self.engineRegistry = engineRegistry
        self.promptManager = promptManager

    def optimizeSource(self, statement, language, code):
        engine = self.engineRegistry.get(language)
        if not engine:
            engine = self.engineRegistry.getDefault()

        templates = self.promptManager.getAllPrompts("optimization")
        responses = []

        for template in templates:
            prompt = statement + "\n" + template + "\n" + language + "\n" + code
            responseText = engine.complete(prompt, {})
            if responseText:
                responses.append(responseText)

        finalResponse = "\n\n---\n\n".join(responses)
        return OptimizationCodeResult(True, finalResponse)