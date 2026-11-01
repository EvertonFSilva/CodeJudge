# Problema: Fatorial e Potenciação com Recursão

O algoritmo implementa funções puramente recursivas para computar o fatorial de um número natural $A$ e a potência de $A$ elevado ao expoente $B$.

## Definições Recursivas
- **Fatorial**:
  - $Fat(0) = 1$
  - $Fat(n) = n \times Fat(n - 1)$ para $n > 0$
- **Potenciação**:
  - $Pot(a, 0) = 1$
  - $Pot(a, b) = a \times Pot(a, b - 1)$ para $b > 0$

## Formato de Entrada
Dois números inteiros não-negativos $A$ e $B$ na mesma linha ($0 \le A \le 20, 0 \le B \le 10$).

## Formato de Saída
Uma única linha no padrão:
`Fat(A)=<fatorial> Pot(A,B)=<potencia>`
