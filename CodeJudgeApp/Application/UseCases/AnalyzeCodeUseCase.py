import time
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Reports.AnalysisReport import AnalysisReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Logging.Logger import Logger

class AnalyzeCodeUseCase:
    def __init__(
        self,
        aiEngine: IAiEngine,
        promptRepository: IPromptRepository,
        languageRepository: ILanguageRepository
    ):
        self.aiEngine = aiEngine
        self.promptRepository = promptRepository
        self.languageRepository = languageRepository
        self.logger = Logger.get()

    def execute(self, statement: str, language: str, code: str) -> AnalysisReport:
        startTime = time.time()
        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Analysis requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Analysis requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code analysis for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory("analysis")
        if templates:
            guidelineBlocks = []
            for key, doc in templates.items():
                title = doc.name or key
                desc = doc.description or ""
                guidelineBlocks.append(
                    f"## Diretriz: {title}\n"
                    f"**Objetivo**: {desc}\n\n"
                    f"{doc.content.strip()}"
                )
            baseGuideline = (
                "Você é um revisor sênior de código e professor de engenharia de software da plataforma CodeJudge.\n"
                "Sua missão é realizar uma análise detalhada, altamente instrutiva e didática do código-fonte para iniciantes.\n"
                "Avalie OBRIGATORIAMENTE CADA UMA das seguintes dimensões de qualidade sem omitir nenhuma:\n\n"
                + "\n\n---\n\n".join(guidelineBlocks)
                + "\n\n"
                "Diretrizes Obrigatórias de Formatação e Conteúdo:\n"
                "1. Para cada dimensão analisada, inicie a seção com um título de nível 1 em Markdown ('# [Título da Dimensão]') para que o título fique grande e destacado na saída.\n"
                "2. Explique os conceitos teóricos de maneira simples, clara e detalhada para quem está aprendendo a programar.\n"
                "3. Utilize negrito ('**...**') para destacar rótulos, notas, diagnósticos, identificadores e conceitos centrais.\n"
                "4. Forneça exemplos práticos de código comparando a abordagem do código com a solução recomendada.\n"
                "5. Mantenha espaçamento adequado com quebras de linha entre parágrafos e tópicos.\n"
                "6. NUNCA utilize emojis em qualquer parte do texto.\n"
                "7. NUNCA utilize termos informais ou clichês genéricos como 'regra de ouro' ou 'dica de ouro'. Empregue terminologia técnica e formal de engenharia de software.\n"
                "8. AO FINAL DA RESPOSTA, VOCÊ DEVE OBRIGATORIAMENTE INCLUIR UMA SEÇÃO DEDICADA:\n"
                "# Código Completo Refatorado e Recomendado\n"
                "Forneça a versão final recomendada e completa do código-fonte em um único bloco de código Markdown (```" + language.lower() + " ... ```). O código deve ser 100% completo, sem trechos omitidos ou reticências, compilável, com formatação limpa, nomenclatura semântica, validações defensivas e separação modular pronta para execução."
            )
        else:
            baseGuideline = (
                "Você é um revisor sênior de código e professor de engenharia de software da plataforma CodeJudge.\n"
                "Realize uma análise didática, estruturada e detalhada do código considerando estilo, fluxo, modularidade e segurança.\n"
                "Inicie cada seção com um título '# ' em Markdown, utilize negrito para termos e diagnósticos centrais, forneça exemplos de melhoria e evite emojis ou clichês genéricos.\n"
                "Ao final, inclua a seção '# Código Completo Refatorado e Recomendado' com o código final completo em bloco Markdown (```" + language.lower() + ")."
            )

        prompt = (
            PromptBuilder(baseGuideline)
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )

        feedback = self.aiEngine.complete(prompt)
        durationMs = round((time.time() - startTime) * 1000, 2)

        self.logger.info(f"Code analysis completed in {durationMs}ms.")
        return AnalysisReport(
            success=True,
            message=feedback,
            feedback=feedback,
            durationMs=durationMs
        )
