import os

class PromptManager:
    def __init__(self, configurationManager=None):
        self.configurationManager = configurationManager
        self.prompts = {}
        self.metadata = {}
        self._loadAllPrompts()

    def _getPath(self, category):
        return self.configurationManager.get("prompts.paths." + category.lower(), None)

    def _loadAllPrompts(self):
        for category, path in self.configurationManager.get("prompts.paths", {}).items():
            if not path or not os.path.isdir(path):
                continue
            categoryLower = category.lower()
            self.prompts[categoryLower] = {}
            self.metadata[categoryLower] = {}
            for file in os.listdir(path):
                if file.endswith(".txt"):
                    promptName = os.path.splitext(file)[0].lower()
                    try:
                        with open(os.path.join(path, file), "r", encoding="utf-8") as f:
                            lines = f.readlines()
                            meta = {}
                            contentLines = []
                            for line in lines:
                                if line.startswith("#name:"):
                                    meta["name"] = line.replace("#name:", "").strip()
                                elif line.startswith("#description:"):
                                    meta["description"] = line.replace("#description:", "").strip()
                                else:
                                    contentLines.append(line)
                            self.prompts[categoryLower][promptName] = "".join(contentLines).strip()
                            self.metadata[categoryLower][promptName] = meta
                    except Exception:
                        continue

    def getPrompt(self, category, promptName):
        return self.prompts.get(category.lower(), {}).get(promptName.lower(), "")

    def getMetadata(self, category, promptName):
        return self.metadata.get(category.lower(), {}).get(promptName.lower(), {})

    def listTemplates(self, category):
        return list(self.prompts.get(category.lower(), {}).keys())

    def getAllPrompts(self, category):
        return list(self.prompts.get(category.lower(), {}).values())
