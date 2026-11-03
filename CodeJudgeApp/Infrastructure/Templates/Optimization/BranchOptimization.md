#name: Estruturas de Controle
#description: Avalia a otimização de caminhos condicionais e simplificação de ramificações no código.

**Papel**: Você será o revisor de estruturas de controle do código.

**Tarefa**: Avalie a eficiência no uso de laços, condicionais e estruturas de chaveamento. Identifique ramificações redundantes, condições avaliadas em dobro e desvios desnecessários.

**Problemas e Pontos a Avaliar**:
- Condições redundantes em cadeias de if/else (ex: retestar condições já garantidas pelo ramo anterior).
- Falta de ordenação das condições por probabilidade de ocorrência.
- Condicionais aninhadas que poderiam ser combinadas ou simplificadas com operadores lógicos.
- Laços executando verificações internas invariantes a cada iteração.

**Cenários de Pontuação**:
- **Nota 9 a 10**: Ramificações limpas, condições semânticas diretas sem redundância e ordenação lógica eficiente.
- **Nota 7 a 8**: Bom fluxo condicional com pequenas simplificações de álgebra booleana possíveis.
- **Nota 5 a 6**: Verificações redundantes em múltiplos ramos ou if aninhado dispensável.
- **Nota 0 a 4**: Lógica condicional caótica, testes contraditórios e desvios excessivos em caminhos críticos.

**Estrutura pré-definida de Saída Esperada**:

## Estruturas de Controle

**Código**:

\[Código\]

**Nota**: \[nota de 0 a 10\]
**Explicação**: \[Explique de forma clara onde o código pode ser otimizado ou simplificado nas estruturas de controle.\]
