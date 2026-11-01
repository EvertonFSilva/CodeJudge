# Problema: Cálculo de Custo ao Consumidor de Veículo

O algoritmo calcula o custo total de um veículo para o consumidor final com base no seu custo de fábrica.

## Regras de Negócio
- **Comissão do Distribuidor**: 12% sobre o custo de fábrica.
- **Impostos Governamentais**: 30% sobre o custo de fábrica.
- **Custo Final**: `Custo Fábrica + (Custo Fábrica * 0.12) + (Custo Fábrica * 0.30) = Custo Fábrica * 1.42`.

## Formato de Entrada
Um número de ponto flutuante representando o custo de fábrica.

## Formato de Saída
O valor final formatado no padrão: `R$ %.2f`.
