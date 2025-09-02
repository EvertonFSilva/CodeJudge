from google import genai
from Core.Base.EngineBase import EngineBase

class GeminiEngine(EngineBase):
    def __init__(self, settings=None):
        super().__init__(settings or {})
        self.apiKey = self.settings.get("apiKey", "")
        self.model = self.settings.get("model", "")
        self.client = genai.Client(api_key=self.apiKey)

    def complete(self, prompt, params=None):
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text or ""
        except Exception as e:
            return f"Erro na IA: {str(e)}"