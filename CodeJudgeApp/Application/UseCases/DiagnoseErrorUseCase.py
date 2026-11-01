from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Infrastructure.Logging.Logger import Logger

class DiagnoseErrorUseCase:
    def __init__(self, promptRepository: IPromptRepository, aiEngine: IAiEngine):
        self.promptRepository = promptRepository
        self.aiEngine = aiEngine
        self.logger = Logger.get()

    def diagnoseCompilationError(self, statement: str, language: str, code: str, logs: str) -> str:
        self.logger.info(f"Generating diagnostic feedback for {language.upper()} compilation error.")
        document = self.promptRepository.getTemplate("error", "compilation")
        if not document or not document.content.strip():
            self.logger.error("Prompt template 'error/compilation' not found in repository.")
            return "Diagnóstico indisponível: template 'error/compilation' não foi localizado no diretório de templates."

        prompt = (
            PromptBuilder(document.content.strip())
            .withLabeledContext("Enunciado da Tarefa", statement or "Não informado")
            .withLabeledContext("Linguagem de Programação", language.upper())
            .withCodeBlock(language, code)
            .withSection("Mensagem do Compilador", logs)
            .build()
        )
        return self.aiEngine.complete(prompt)

    def diagnoseExecutionError(self, statement: str, language: str, code: str, errorMessage: str) -> str:
        self.logger.info(f"Generating diagnostic feedback for {language.upper()} execution failure.")
        document = self.promptRepository.getTemplate("error", "execution")
        if not document or not document.content.strip():
            self.logger.error("Prompt template 'error/execution' not found in repository.")
            return "Diagnóstico indisponível: template 'error/execution' não foi localizado no diretório de templates."

        prompt = (
            PromptBuilder(document.content.strip())
            .withLabeledContext("Enunciado da Tarefa", statement or "Não informado")
            .withLabeledContext("Linguagem de Programação", language.upper())
            .withCodeBlock(language, code)
            .withSection("Erro em Tempo de Execução", errorMessage)
            .build()
        )
        return self.aiEngine.complete(prompt)

    def diagnoseLogicMismatch(self, statement: str, language: str, code: str, mismatchDetails: str) -> str:
        self.logger.info(f"Generating diagnostic feedback for {language.upper()} logic mismatch.")
        document = self.promptRepository.getTemplate("error", "logicmismatch")
        if not document or not document.content.strip():
            self.logger.error("Prompt template 'error/logicmismatch' not found in repository.")
            return "Diagnóstico indisponível: template 'error/logicmismatch' não foi localizado no diretório de templates."

        prompt = (
            PromptBuilder(document.content.strip())
            .withLabeledContext("Enunciado da Tarefa", statement or "Não informado")
            .withLabeledContext("Linguagem de Programação", language.upper())
            .withCodeBlock(language, code)
            .withSection("Divergência nos Casos de Teste", mismatchDetails)
            .build()
        )
        return self.aiEngine.complete(prompt)
