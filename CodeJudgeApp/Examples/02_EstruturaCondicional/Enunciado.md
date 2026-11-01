# Problema: Classificação de Desempenho Acadêmico

O programa recebe três notas de avaliações de um estudante e calcula a sua média ponderada com pesos 2, 3 e 5.

## Fórmula de Cálculo
`Média = (Nota1 * 2 + Nota2 * 3 + Nota3 * 5) / 10.0`

## Critérios de Classificação
- Média maior ou igual a 7.0: `APROVADO: <media>`
- Média entre 5.0 e 6.99: `RECUPERACAO: <media>`
- Média abaixo de 5.0: `REPROVADO: <media>`

## Formato de Entrada
Três valores de ponto flutuante separados por espaço (ex: `8.0 7.0 8.0`).

## Formato de Saída
A classificação seguida da média com 2 casas decimais.
