from typing import Dict, Any, Optional
from Domain.Contracts.IPromptRepository import IPromptRepository

class PromptUseCase:
    def __init__(self, promptRepository: IPromptRepository):
        self.promptRepository = promptRepository

    def getAll(self) -> Dict[str, Any]:
        catalog = self.promptRepository.listAll()
        return {
            category: {
                key: {
                    "metadata": {"name": doc.name, "description": doc.description},
                    "content": doc.content
                }
                for key, doc in templates.items()
            }
            for category, templates in catalog.items()
        }

    def getByCategory(self, category: str) -> Dict[str, Any]:
        templates = self.promptRepository.getByCategory(category)
        return {
            key: {
                "metadata": {"name": doc.name, "description": doc.description},
                "content": doc.content
            }
            for key, doc in templates.items()
        }

    def getSingle(self, category: str, name: str) -> Optional[Dict[str, Any]]:
        document = self.promptRepository.getTemplate(category, name)
        if not document:
            return None
        return {
            "metadata": {"name": document.name, "description": document.description},
            "content": document.content
        }
