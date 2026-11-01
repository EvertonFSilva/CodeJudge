import time
from Domain.Contracts.IAiEngine import IAiEngine
from Domain.Contracts.IPromptRepository import IPromptRepository
from Domain.Contracts.ILanguageRepository import ILanguageRepository
from Domain.Entities.PromptBuilder import PromptBuilder
from Domain.Reports.OptimizationReport import OptimizationReport
from Domain.Exceptions.DomainException import UnsupportedLanguageException, EmptySourceCodeException
from Infrastructure.Logging.Logger import Logger

class OptimizeCodeUseCase:
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

    def execute(self, statement: str, language: str, code: str) -> OptimizationReport:
        startTime = time.time()
        if not self.languageRepository.isLanguageSupported(language):
            self.logger.warning(f"Optimization requested for unsupported language: '{language}'.")
            raise UnsupportedLanguageException(language)

        if not code or not code.strip():
            self.logger.warning("Optimization requested for empty source code.")
            raise EmptySourceCodeException()

        self.logger.info(f"Initiating code optimization for {language.upper()} source code.")

        templates = self.promptRepository.getByCategory("optimization")
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
                "Você é um engenheiro sênior de sistemas e professor de otimização de algoritmos da plataforma CodeJudge.\n"
                "Sua missão é realizar uma análise de desempenho aprofundada, didática e acessível para iniciantes.\n"
                "Avalie OBRIGATORIAMENTE CADA UMA das seguintes dimensões de otimização sem omitir nenhuma:\n\n"
                + "\n\n---\n\n".join(guidelineBlocks)
                + "\n\n"
                "Diretrizes Obrigatórias de Formatação e Conteúdo:\n"
                "1. Para cada dimensão avaliada, inicie a seção com um título de nível 1 em Markdown ('# [Título da Otimização]') para que o título fique grande e destacado na saída.\n"
                "2. Explique os fundamentos de complexidade assintótica (Big-O), memória e operações de máquina de forma didática para quem está aprendendo a programar.\n"
                "3. Utilize negrito ('**...**') para destacar rótulos, notas, complexidades (ex: **O(N)**, **O(1)**), diagnósticos e termos centrais.\n"
                "4. Forneça comparativos práticos com código original e código otimizado, justificando as economias de instruções e memória.\n"
                "5. Mantenha espaçamento visual adequado com quebras de linha entre tópicos.\n"
                "6. NUNCA utilize emojis em qualquer parte do texto.\n"
                "7. NUNCA utilize termos informais ou clichês genéricos como 'regra de ouro' ou 'dica de ouro'. Empregue terminologia técnica e formal de engenharia de software."
            )
        else:
            baseGuideline = (
                "Você é um engenheiro sênior de sistemas e professor de otimização de algoritmos da plataforma CodeJudge.\n"
                "Realize uma análise didática e aprofundada de eficiência assintótica, uso de memória e estruturas de dados.\n"
                "Inicie cada seção com um título '# ' em Markdown, utilize negrito para métricas de complexidade e termos centrais, forneça exemplos de otimização e evite emojis ou clichês genéricos."
            )

        prompt = (
            PromptBuilder(baseGuideline)
            .withSection("Requisitos da Tarefa", statement or "Especificação padrão")
            .withCodeBlock(language, code)
            .build()
        )

        recommendations = self.aiEngine.complete(prompt)
        durationMs = round((time.time() - startTime) * 1000, 2)

        self.logger.info(f"Code optimization completed in {durationMs}ms.")
        return OptimizationReport(
            success=True,
            message=recommendations,
            recommendations=recommendations,
            durationMs=durationMs
        )
