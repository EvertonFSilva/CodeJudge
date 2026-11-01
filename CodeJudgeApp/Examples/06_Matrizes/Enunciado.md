# Problema: Diagonais de uma Matriz Quadrada

O algoritmo lê a dimensão $N$ de uma matriz quadrada $N \times N$ e seus respectivos $N \times N$ elementos, computando a soma da diagonal principal e a soma da diagonal secundária.

## Definição
- **Diagonal Principal**: elementos onde o índice da linha é igual ao índice da coluna: $i == j$.
- **Diagonal Secundária**: elementos onde $i + j == N - 1$.

## Formato de Entrada
O primeiro valor indica a ordem $N$ ($N \ge 1$), seguido pelos $N \times N$ números inteiros dispostos em sequência na mesma linha.

## Formato de Saída
Uma única linha no padrão:
`Principal=<soma> Secundaria=<soma>`
