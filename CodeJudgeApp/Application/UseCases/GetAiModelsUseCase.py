from typing import Dict, Any, List
from Domain.Contracts.IAiProviderRepository import IAiProviderRepository

class GetAiModelsUseCase:
    def __init__(self, aiProviderRepository: IAiProviderRepository):
        self.aiProviderRepository = aiProviderRepository

    def execute(self) -> Dict[str, Any]:
        providers = self.aiProviderRepository.getAllAiProviders()
        defaultEngine = self.aiProviderRepository.getDefaultEngineName().strip().lower()
        defaultProvider = providers.get(defaultEngine)
        defaultModel = defaultProvider.defaultModel if defaultProvider else ""

        enginesList: List[Dict[str, Any]] = [
            {
                "key": provider.key,
                "name": provider.name,
                "adapter": provider.adapter,
                "defaultModel": provider.defaultModel,
                "supportedModels": provider.supportedModels,
                "requiresApiKey": provider.requiresApiKey,
                "isDefault": provider.isDefault
            }
            for provider in providers.values()
        ]

        return {
            "isUserKeyRequired": self.aiProviderRepository.isUserKeyRequired(),
            "defaultEngine": defaultEngine,
            "defaultModel": defaultModel,
            "engines": enginesList
        }
