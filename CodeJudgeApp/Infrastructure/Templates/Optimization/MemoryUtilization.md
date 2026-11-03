#name: Utilização de Memória
#description: Avalia o consumo de memória, reaproveitamento de buffers e dimensionamento de estruturas.

**Papel**: Você será o avaliador universitário de eficiência de memória.

**Tarefa**: Avalie se o código utiliza a memória de forma responsável, evitando cópias desnecessárias de dados, retenção prolongada e alocações de tamanho excessivo.

**Problemas e Pontos a Avaliar**:
- Criação repetida de arrays ou objetos temporários dentro de laços de repetição.
- Passagem de estruturas volumosas por valor gerando cópias desnecessárias na pilha.
- Vetores alocados com tamanho muito superior ao limite real do problema.
- Retenção de referências desnecessárias impedindo a liberação de memória.

**Cenários de Pontuação**:
- **Nota 9 a 10**: Consumo enxuto de memória, estruturas dimensionadas com precisão e reutilização consciente de buffers.
- **Nota 7 a 8**: Consumo adequado com pequenas alocações temporárias que têm impacto desprezível.
- **Nota 5 a 6**: Alocações frequentes em laços gerando sobrecarga evitável no gerenciador de memória.
- **Nota 0 a 4**: Desperdício massivo de memória com estruturas de tamanho abusivo ou cópias volumosas contínuas.

**Estrutura pré-definida de Saída Esperada**:

## Utilização de Memória

**Código**:

\[Código\]

**Nota**: \[nota de 0 a 10\]
**Explicação**: \[Explique de forma clara e objetiva como o uso de memória pode ser otimizado.\]
