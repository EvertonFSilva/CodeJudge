from typing import Dict, Optional
from Domain.Contracts.ICompiler import ICompiler
from Domain.Contracts.ICompilerRegistry import ICompilerRegistry
from Infrastructure.Compilers.ConfigurableCompiler import ConfigurableCompiler
from Infrastructure.Config.ConfigurationManager import ConfigurationManager
from Infrastructure.Logging.Logger import Logger

class CompilerRegistry(ICompilerRegistry):
    def __init__(self, config: ConfigurationManager):
        self.config = config
        self.logger = Logger.get()
        self.compilers: Dict[str, ICompiler] = {}
        self.initializeCompilers()

    def initializeCompilers(self):
        languages = self.config.getAllLanguages()
        for key, language in languages.items():
            self.compilers[key] = ConfigurableCompiler(language)
        self.logger.info(f"CompilerRegistry dynamically initialized for languages: {list(self.compilers.keys())}.")

    def getCompiler(self, language: str) -> Optional[ICompiler]:
        return self.compilers.get(language.strip().lower())
