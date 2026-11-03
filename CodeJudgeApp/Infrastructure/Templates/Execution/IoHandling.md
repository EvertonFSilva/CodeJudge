#name: Tratamento de Entrada e Saída (I/O)
#description: Avalia a conformidade de leitura e escrita e a formatação das saídas produzidas pelo código.

**Papel**: Você será o avaliador universitário.

**Tarefa**: Verifique se as rotinas de leitura e escrita processam entradas e formatam saídas rigorosamente conforme o padrão especificado na tarefa.

**Problemas e Pontos a Avaliar**:
- Quebras de linha extras ou ausentes corrompendo a validação automatizada.
- Problemas de consumo de caracteres no buffer (ex: scanf com enter pendente antes de fgets/getline).
- Mensagens de prompt interativo desnecessárias em exercícios que exigem apenas o valor final.
- Impressão desordenada ou com arredondamento divergente do solicitado.

**Cenários de Pontuação**:
- **Nota 9 a 10**: Entrada e saída perfeitamente sincronizadas, sem resíduos de buffer e saída formatada com rigor.
- **Nota 7 a 8**: I/O correto com pequenas diferenças cosméticas que não afetam a extração dos valores.
- **Nota 5 a 6**: Problemas de leitura de caracteres que exigem correções no fluxo de entrada.
- **Nota 0 a 4**: Falha na leitura, travamento aguardando entrada ou saída completamente fora do formato.

**Estrutura pré-definida de Saída Esperada**:

## Tratamento de Entrada e Saída

**Status**: [Correto | Inconsistente]
**Nota**: [Nota de 0 a 10]
**Explicação**: \[Explicação objetiva sobre o fluxo de entrada e saída do código\]
