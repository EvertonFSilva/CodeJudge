import os
from typing import Optional, Dict, Any
import httpx
from Domain.Contracts.IAiEngine import IAiEngine
from Infrastructure.Logging.Logger import Logger

class OllamaAdapter(IAiEngine):
    def __init__(self, args: Dict[str, Any]):
        self.isLocal = True
        ignoreServerKey = bool(args.get("ignoreServerKey", False))
        self.endpoint = (os.environ.get("OLLAMA_ENDPOINT") or args.get("endpoint") or "").rstrip("/")
        if ignoreServerKey:
            self.model = str(args.get("model", "llama3:latest")).strip()
            self.apiKey = str(args.get("apiKey", "")).strip()
        else:
            self.model = os.environ.get("OLLAMA_MODEL") or args.get("model", "llama3:latest")
            self.apiKey = os.environ.get("OLLAMA_API_KEY") or args.get("apiKey", "")
        configuredTimeout = float(os.environ.get("OLLAMA_TIMEOUT_SECONDS") or args.get("timeoutSeconds", 300.0))
        self.timeoutSeconds = max(configuredTimeout, 180.0)
        self._httpClient = httpx.Client(timeout=httpx.Timeout(self.timeoutSeconds, connect=15.0))
        self.logger = Logger.get()
        self.logger.info(f"OllamaAdapter initialized with endpoint '{self.endpoint}', model '{self.model}', timeout: {self.timeoutSeconds}s.")

    def isLocalEngine(self) -> bool:
        return True

    def complete(self, prompt: str, parameters: Optional[Dict[str, Any]] = None) -> str:
        if not self.endpoint or not self.model:
            return "Ollama adapter configuration error: 'endpoint' and 'model' must be defined in Configuration.json."

        headers = {"Content-Type": "application/json"}
        if self.apiKey:
            headers["Authorization"] = f"Bearer {self.apiKey}"

        chatUrl = f"{self.endpoint}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": parameters.get("temperature", 0.3) if parameters else 0.3
        }

        self.logger.debug(f"Dispatching prompt to Ollama ({chatUrl}), model: {self.model}.")

        try:
            response = self._httpClient.post(chatUrl, json=payload, headers=headers)

            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    content = choices[0]["message"].get("content", "")
                    self.logger.debug(f"Ollama response received ({len(content)} characters).")
                    return content
                if "response" in data:
                    return data["response"]
                return str(data)

            if "/api/generate" in self.endpoint or "11434" in self.endpoint:
                fallbackUrl = f"{self.endpoint.replace('/v1', '')}/api/generate"
                fallbackPayload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
                resFall = self._httpClient.post(fallbackUrl, json=fallbackPayload, headers=headers)
                if resFall.status_code == 200:
                    return resFall.json().get("response", "")

            errorMessage = f"HTTP Error {response.status_code} from Ollama: {response.text}"
            self.logger.error(errorMessage)
            return errorMessage

        except httpx.ConnectError:
            message = f"Ollama server at {self.endpoint} unreachable. Ensure Ollama service is active and model '{self.model}' is installed."
            self.logger.warning(message)
            return message
        except httpx.TimeoutException:
            message = f"Ollama demorou mais de {self.timeoutSeconds}s para responder (timeout). O modelo local '{self.model}' pode estar gerando os tokens em velocidade reduzida. Tente novamente ou aguarde a conclusão."
            self.logger.error(message)
            return message
        except Exception as error:
            self.logger.error("Exception during Ollama invocation", error)
            return f"Ollama error: {str(error)}"

    def isAvailable(self) -> bool:
        if not self.endpoint or not self.model:
            return False
        testUrl = f"{self.endpoint}/models"
        try:
            response = self._httpClient.get(testUrl, timeout=2.0)
            return response.status_code == 200
        except Exception:
            try:
                baseHost = self.endpoint.replace("/v1", "")
                response = self._httpClient.get(baseHost, timeout=2.0)
                return response.status_code in (200, 404)
            except Exception:
                return False
