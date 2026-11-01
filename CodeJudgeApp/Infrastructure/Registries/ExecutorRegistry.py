from typing import Dict, Optional
from Domain.Contracts.IExecutor import IExecutor
from Domain.Contracts.IExecutorRegistry import IExecutorRegistry
from Infrastructure.Executors.ConfigurableExecutor import ConfigurableExecutor
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger

class ExecutorRegistry(IExecutorRegistry):
    def __init__(self, config: ConfigurationManager):
        self.config = config
        self.logger = Logger.get()
        self.executors: Dict[str, IExecutor] = {}
        self.initializeExecutors()

    def initializeExecutors(self):
        languages = self.config.getAllLanguages()
        for key, language in languages.items():
            self.executors[key] = ConfigurableExecutor(language)
        self.logger.info(f"ExecutorRegistry dynamically initialized for languages: {list(self.executors.keys())}.")

    def getExecutor(self, language: str) -> Optional[IExecutor]:
        return self.executors.get(language.strip().lower())
