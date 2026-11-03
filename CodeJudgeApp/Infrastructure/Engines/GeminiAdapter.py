import os
import re
import threading
from typing import Optional, Dict, Any, List
from Domain.Contracts.IAiEngine import IAiEngine
from Infrastructure.Logging.Logger import Logger

class GeminiAdapter(IAiEngine):
    _resolvedModelMap: Dict[str, str] = {}
    _verifiedModels = set()
    _lock = threading.Lock()
    _fallbackOrder: List[str] = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-4-argon"
    ]

    def __init__(self, args: Dict[str, Any]):
        ignoreServerKey = bool(args.get("ignoreServerKey", False))
        if ignoreServerKey:
            self.apiKey = str(args.get("apiKey", "")).strip()
            rawModel = str(args.get("model", "")).strip()
        else:
            self.apiKey = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or args.get("apiKey", "")
            rawModel = os.environ.get("GEMINI_MODEL") or args.get("model", "")
        self.model = GeminiAdapter._resolvedModelMap.get(rawModel, rawModel)
        self.logger = Logger.get()
        self.client = None
        self.setupClient()

    def setupClient(self):
        if not self.apiKey:
            self.logger.warning("GeminiAdapter: API key not provided in configuration or request parameters.")
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

    def _buildFallbackCandidates(self, failedModel: str, errorText: str) -> List[str]:
        candidates: List[str] = []
        suggested = re.findall(r"models/([a-zA-Z0-9._-]+)", errorText)
        for item in suggested:
            if item and item != failedModel and item not in candidates:
                candidates.append(item)
        for item in GeminiAdapter._fallbackOrder:
            if item != failedModel and item not in candidates:
                candidates.append(item)
        return candidates

    def _generateWithFallback(self, prompt: str) -> str:
        activeModel = GeminiAdapter._resolvedModelMap.get(self.model, self.model)
        try:
            self.logger.debug(f"Dispatching prompt to Gemini ({activeModel}), size: {len(prompt)} characters.")
            response = self.client.models.generate_content(
                model=activeModel,
                contents=prompt
            )
            GeminiAdapter._verifiedModels.add(activeModel)
            text = response.text or ""
            self.logger.debug(f"Gemini response received successfully ({len(text)} characters).")
            return text
        except Exception as error:
            errorStr = str(error)
            if "404" in errorStr or "NOT_FOUND" in errorStr or "no longer available" in errorStr:
                for candidate in self._buildFallbackCandidates(activeModel, errorStr):
                    try:
                        fallbackRes = self.client.models.generate_content(
                            model=candidate,
                            contents=prompt
                        )
                        GeminiAdapter._resolvedModelMap[self.model] = candidate
                        GeminiAdapter._resolvedModelMap[activeModel] = candidate
                        GeminiAdapter._verifiedModels.add(candidate)
                        self.logger.warning(
                            f"Gemini model '{activeModel}' unavailable (404); automatically switched to '{candidate}'."
                        )
                        self.model = candidate
                        return fallbackRes.text or ""
                    except Exception as candErr:
                        candErrStr = str(candErr)
                        if "404" in candErrStr or "NOT_FOUND" in candErrStr or "no longer available" in candErrStr:
                            continue
                        errorStr = candErrStr
                        break

            if "API_KEY_INVALID" in errorStr or "API key not valid" in errorStr or "INVALID_ARGUMENT" in errorStr:
                self.logger.warning(f"Gemini API key rejected for model '{activeModel}'.")
                return "AI Engine (Gemini): Chave de API inválida ou revogada. Verifique a 'apiKey' fornecida."
            if "429" in errorStr or "RESOURCE_EXHAUSTED" in errorStr:
                self.logger.warning(f"Gemini quota exceeded for model '{activeModel}'.")
                return "AI Engine (Gemini): Limite de requisições (quota) atingido para a chave informada. Aguarde alguns instantes ou utilize outro modelo."
            self.logger.warning(f"Gemini API request failed ({activeModel}): {errorStr}")
            return f"AI Engine (Gemini) error: {errorStr}"

    def complete(self, prompt: str, parameters: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            self.setupClient()
            if not self.client:
                return "Gemini AI indisponível: Chave de API não informada. Forneça 'apiKey' nos parâmetros da solicitação ou em Configuration.json."

        activeModel = GeminiAdapter._resolvedModelMap.get(self.model, self.model)
        if activeModel not in GeminiAdapter._verifiedModels:
            with GeminiAdapter._lock:
                activeModel = GeminiAdapter._resolvedModelMap.get(self.model, self.model)
                if activeModel not in GeminiAdapter._verifiedModels:
                    return self._generateWithFallback(prompt)

        return self._generateWithFallback(prompt)

    def isAvailable(self) -> bool:
        return bool(self.client and self.apiKey and self.model)
