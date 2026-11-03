export function normalizeMarkdownCodeFences(text: string): string {
  if (!text) return '';
  let str = text;
  str = str.replace(/^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)$/gm, '$1\n$2');
  str = str.replace(/^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)[ \t]+([^\r\n]+)$/gm, '$1\n$2\n$3');
  str = str.replace(/^(?!```)(.+?)[ \t]*(```\s*)$/gm, '$1\n```');
  return str;
}

import { TestCaseResult } from './TestCase';

export interface StageExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
  durationMs?: number;
}

export interface ReportProps {
  fileName: string;
  language: string;
  code?: string;
  statement?: string;
  compilation?: StageExecutionResult;
  execution?: StageExecutionResult & { testResults?: TestCaseResult[]; successRate?: number };
  analysis?: StageExecutionResult;
  optimization?: StageExecutionResult;
  hasTests?: boolean;
  allSucceeded: boolean;
  stoppedEarly: boolean;
  stopReason?: string;
  createdAt: Date;
}

export class Report {
  constructor(public readonly props: ReportProps) {}

  public toMarkdown(): string {
    const {
      fileName,
      language,
      code,
      statement,
      compilation,
      execution,
      analysis,
      optimization,
      hasTests,
      allSucceeded,
      stoppedEarly
    } = this.props;

    const lines: string[] = [];

    lines.push(`# CodeJudge`);
    lines.push(`## Relatório Técnico de Execução`);
    lines.push(`> **Arquivo:** \`${fileName}\` | **Linguagem:** \`${language.toUpperCase()}\` | **Data:** ${new Date().toLocaleString('pt-BR')}`);
    lines.push(`> **Status:** ${allSucceeded ? '[Concluído com Sucesso]' : stoppedEarly ? '[Interrompido na Compilação]' : '[Concluído com Observações]'}`);

    if (statement && statement.trim()) {
      lines.push(`\n### Enunciado / Requisitos`);
      lines.push(`> ${statement.trim().replace(/\n/g, '\n> ')}`);
    }

    if (code && code.trim()) {
      lines.push(`\n### Código-Fonte Processado (\`${language.toUpperCase()}\`)`);
      lines.push(`\`\`\`${language}\n${code.trim()}\n\`\`\``);
    }

    lines.push(`\n---`);

    if (compilation) {
      lines.push(`\n### 1. Compilação`);
      if (compilation.success) {
        lines.push(`- **Resultado:** [Aprovado] Código compilado sem erros de sintaxe.`);
      } else {
        lines.push(`- **Resultado:** [Falha] Erro de compilação detectado.`);
        lines.push(`\n#### Detalhes do Erro:`);
        lines.push(compilation.message || 'Verifique declarações, pontuação e tipos de variáveis no código.');
        if (compilation.data?.logs && typeof compilation.data.logs === 'string' && compilation.data.logs.trim()) {
          lines.push(`\n\`\`\`text\n${compilation.data.logs.trim()}\n\`\`\``);
        }
        if (compilation.data?.details?.aiFeedback && typeof compilation.data.details.aiFeedback === 'string' && compilation.data.details.aiFeedback.trim()) {
          lines.push(`\n#### Diagnóstico Formativo (IA):`);
          lines.push(compilation.data.details.aiFeedback.trim());
        }
      }
    }

    if (stoppedEarly) {
      lines.push(`\n> **Aviso:** Como o código não compilou, as etapas seguintes foram pausadas.`);
      return normalizeMarkdownCodeFences(lines.join('\n'));
    }

    if (execution) {
      lines.push(`\n### 2. Execução`);
      const hasRealTests =
        Boolean(hasTests) &&
        Boolean(execution.testResults && execution.testResults.length > 0) &&
        Boolean(execution.testResults?.some(t => (t.input && t.input.trim().length > 0) || (t.expected && t.expected.trim().length > 0)));

      if (hasRealTests && execution.testResults) {
        const tests = execution.testResults;
        const rate = execution.successRate ?? 0;
        const passedCount = tests.filter(t => t.passed).length;

        lines.push(`- **Resultado:** ${passedCount} de ${tests.length} casos de teste aprovados (**${rate}% de conformidade**).`);
        lines.push(``);
        lines.push(`| Caso | Entrada | Saída Obtida | Gabarito Esperado | Status |`);
        lines.push(`|:---:|:---|:---|:---|:---:|`);

        tests.forEach((t, i) => {
          const inTxt = t.input ? `\`${t.input.replace(/\n/g, ' ')}\`` : '_vazia_';
          const actTxt = t.actual ? `\`${t.actual.replace(/\n/g, ' ')}\`` : '_sem saída_';
          const expTxt = t.expected ? `\`${t.expected.replace(/\n/g, ' ')}\`` : '_não informado_';
          const resTxt = t.passed ? '[Aprovado]' : '[Divergente]';
          lines.push(`| #${i + 1} | ${inTxt} | ${actTxt} | ${expTxt} | ${resTxt} |`);
        });
      } else {
        lines.push(`- **Resultado:** Execução realizada sem casos de teste informados.`);
        const out = execution.data?.output || execution.data?.stdout || (Array.isArray(execution.data?.outputs) ? execution.data.outputs.map((o: any) => typeof o === 'object' ? (o.actual ?? o.output ?? '') : String(o)).join('\n') : '');
        if (out && typeof out === 'string' && out.trim() !== '') {
          lines.push(`\n#### Saída do Programa:`);
          lines.push(`\`\`\`\n${out.trim()}\n\`\`\``);
        } else {
          lines.push(`- **Status:** Programa executado com sucesso.`);
        }
      }
      if (execution.data?.details?.aiFeedback && typeof execution.data.details.aiFeedback === 'string' && execution.data.details.aiFeedback.trim()) {
        lines.push(`\n#### Diagnóstico Formativo (IA):`);
        lines.push(execution.data.details.aiFeedback.trim());
      }
    }

    if (analysis) {
      lines.push(`\n### 3. Análise de Código`);
      lines.push(analysis.message || '- Nenhuma inconsistência estrutural identificada.');
    }

    if (optimization) {
      lines.push(`\n### 4. Otimização`);
      lines.push(optimization.message || '- Algoritmo com tempo e consumo de memória adequados.');
    }

    lines.push(`\n---`);
    lines.push(`\n*CodeJudge • Desenvolvido por Everton*`);

    return normalizeMarkdownCodeFences(lines.join('\n'));
  }
}
