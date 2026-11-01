from typing import Optional, Dict, Any
from Domain.Contracts.IAiEngine import IAiEngine
from Infrastructure.Logging.Logger import Logger

class GeminiAdapter(IAiEngine):
    def __init__(self, args: Dict[str, Any]):
        self.apiKey = args.get("apiKey", "")
        self.model = args.get("model", "")
        self.logger = Logger.get()
        self.client = None
        self.setupClient()

    def setupClient(self):
        if not self.apiKey:
            self.logger.warning("GeminiAdapter: API key not provided in configuration.")
            return
        if not self.model:
            self.logger.warning("GeminiAdapter: Model name not provided in configuration.")
            return
        try:
            from google import genai
            self.client = genai.Client(api_key=self.apiKey)
            self.logger.info(f"GeminiAdapter connected to model '{self.model}'.")
        except Exception as error:
            self.logger.error("Failed to initialize Google GenAI client", error)

    def complete(self, prompt: str, parameters: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            self.setupClient()
            if not self.client:
                return "Gemini AI engine unavailable. Check apiKey and model in Configuration.json."

        try:
            self.logger.debug(f"Dispatching prompt to Gemini ({self.model}), size: {len(prompt)} characters.")
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            text = response.text or ""
            self.logger.debug(f"Gemini response received successfully ({len(text)} characters).")
            return text
        except Exception as error:
            self.logger.error("Exception during Gemini API request", error)
            return f"AI Engine (Gemini) error: {str(error)}"

    def isAvailable(self) -> bool:
        return bool(self.client and self.apiKey and self.model)
