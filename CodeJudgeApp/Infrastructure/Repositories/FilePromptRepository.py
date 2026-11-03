import os
import time
from typing import Dict, Optional
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Entities.PromptDocument import PromptDocument
from Infrastructure.Logging.Logger import Logger

class FilePromptRepository(IPromptRepository):
    def __init__(self, basePath: str):
        self.basePath = basePath
        self.logger = Logger.get()
        self.prompts: Dict[str, Dict[str, PromptDocument]] = {}
        self._lastLoadedTime: float = 0.0
        self.loadTemplates()

    def _isStale(self) -> bool:
        if not os.path.isdir(self.basePath):
            return False
        maxMtime = os.path.getmtime(self.basePath)
        for root, _, files in os.walk(self.basePath):
            for f in files:
                try:
                    t = os.path.getmtime(os.path.join(root, f))
                    if t > maxMtime:
                        maxMtime = t
                except OSError:
                    pass
        return maxMtime > self._lastLoadedTime

    def ensureLoaded(self):
        if not self.prompts or self._isStale():
            self.loadTemplates()

    def loadTemplates(self):
        if not os.path.isdir(self.basePath):
            self.logger.warning(f"Templates directory not found at: {self.basePath}")
            return

        categories = [item for item in os.listdir(self.basePath) if os.path.isdir(os.path.join(self.basePath, item))]
        freshPrompts: Dict[str, Dict[str, PromptDocument]] = {}
        for category in categories:
            categoryKey = category.lower()
            freshPrompts[categoryKey] = {}
            categoryDirectory = os.path.join(self.basePath, category)
            for fileName in os.listdir(categoryDirectory):
                if fileName.endswith(".md") or fileName.endswith(".txt"):
                    promptKey = os.path.splitext(fileName)[0].lower()
                    filePath = os.path.join(categoryDirectory, fileName)
                    try:
                        document = self.readTemplateFile(category, promptKey, filePath)
                        if document:
                            freshPrompts[categoryKey][promptKey] = document
                    except Exception as error:
                        self.logger.error(f"Error reading prompt template '{filePath}': {str(error)}", error)

        self.prompts = freshPrompts
        self._lastLoadedTime = time.time()
        self.logger.info(f"Prompt templates loaded from {self.basePath}. Categories: {list(self.prompts.keys())}.")

    def readTemplateFile(self, category: str, key: str, filePath: str) -> Optional[PromptDocument]:
        with open(filePath, "r", encoding="utf-8") as file:
            lines = file.readlines()

        name = key
        description = ""
        bodyLines = []

        for line in lines:
            if line.startswith("#name:"):
                name = line.replace("#name:", "").strip()
            elif line.startswith("#description:"):
                description = line.replace("#description:", "").strip()
            else:
                bodyLines.append(line)

        return PromptDocument(
            name=name,
            description=description,
            category=category,
            content="".join(bodyLines).strip()
        )

    def getTemplate(self, category: str, templateName: str) -> Optional[PromptDocument]:
        self.ensureLoaded()
        categoryKey = category.lower().strip()
        documentKey = templateName.lower().strip()
        return self.prompts.get(categoryKey, {}).get(documentKey)

    def getByCategory(self, category: str) -> Dict[str, PromptDocument]:
        self.ensureLoaded()
        categoryKey = category.lower().strip()
        return self.prompts.get(categoryKey, {})

    def listAll(self) -> Dict[str, Dict[str, PromptDocument]]:
        self.ensureLoaded()
        return self.prompts
