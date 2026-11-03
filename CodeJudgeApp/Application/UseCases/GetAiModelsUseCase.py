from typing import Dict, Any, List, Optional
from Domain.Contracts.IAiProviderRepository import IAiProviderRepository

class GetAiModelsUseCase:
    def __init__(self, aiProviderRepository: IAiProviderRepository):
        self.aiProviderRepository = aiProviderRepository

    def execute(self, engineKey: Optional[str] = None) -> Dict[str, Any]:
        providers = self.aiProviderRepository.getAllAiProviders()
        defaultEngine = self.aiProviderRepository.getDefaultEngineName().strip().lower()
        defaultProvider = providers.get(defaultEngine)
        defaultModel = defaultProvider.defaultModel if defaultProvider else ""

        if engineKey:
            target = self.aiProviderRepository.getAiProvider(engineKey)
            filteredProviders = {target.key: target} if target else {}
        else:
            filteredProviders = providers

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
            for provider in filteredProviders.values()
        ]

        providersMap: Dict[str, List[str]] = {
            provider.key: list(provider.supportedModels)
            for provider in filteredProviders.values()
        }

        allModels: List[str] = self.aiProviderRepository.getSupportedModels(engineKey)

        return {
            "isUserKeyRequired": self.aiProviderRepository.isUserKeyRequired(),
            "allowUserKeyOverride": True,
            "defaultEngine": defaultEngine,
            "defaultModel": defaultModel,
            "models": allModels,
            "providers": providersMap,
            "engines": enginesList
        }
