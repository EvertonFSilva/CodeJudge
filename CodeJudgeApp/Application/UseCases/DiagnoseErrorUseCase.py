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
        guideline = document.content if document else (
            "Você é um tutor acadêmico rigoroso e focado no aprendizado do estudante.\n"
            "DIRETRIZ INEGOCIÁVEL: NUNCA forneça a resposta pronta, NUNCA exiba código corrigido e NUNCA altere o código pelo usuário.\n"
            "Seu papel é exclusivamente orientar: explique o conceito sintático/semântico violado, "
            "indique onde ele deve concentrar a atenção e formule perguntas reflexivas para guiá-lo na descoberta da solução."
        )

        prompt = (
            PromptBuilder(guideline)
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
        guideline = document.content if document else (
            "Você é um tutor acadêmico rigoroso e focado no aprendizado do estudante.\n"
            "DIRETRIZ INEGOCIÁVEL: NUNCA forneça a resposta pronta, NUNCA exiba código corrigido e NUNCA altere o código pelo usuário.\n"
            "Explique o provável motivo da falha em tempo de execução (estouro de limites, ponteiro nulo, divisão por zero ou tempo limite), "
            "ajude o estudante a rastrear o estado das variáveis e formule perguntas reflexivas para que ele descubra a correção sozinho."
        )

        prompt = (
            PromptBuilder(guideline)
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
        guideline = document.content if document else (
            "Você é um tutor acadêmico focado no raciocínio do estudante.\n"
            "DIRETRIZ INEGOCIÁVEL: NUNCA entregue a resposta pronta nem o código corrigido.\n"
            "Ajude o estudante a refletir sobre por que o resultado produzido pelo seu algoritmo divergiu do esperado, "
            "orientando-o a analisar o fluxo lógico e as condições de contorno."
        )

        prompt = (
            PromptBuilder(guideline)
            .withLabeledContext("Enunciado da Tarefa", statement or "Não informado")
            .withLabeledContext("Linguagem de Programação", language.upper())
            .withCodeBlock(language, code)
            .withSection("Divergência nos Casos de Teste", mismatchDetails)
            .build()
        )
        return self.aiEngine.complete(prompt)
