#include <stdio.h>

int main() {
    int n, a = 0, b = 1, i, temp;

    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        printf("%d ", a);
        temp = a;
        a = b;
        b = temp + b;
    }

    return 0;
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - O códgio é muito simples, então não deve apresentar
// esse tipo de problema.

// CodeStyle - As declarações de variaveis estão na mesma linha. (linha 4) - Não
// detectou apenas pediu para adicionar comentários para 10.

// Modularity - Estrutura do código está totalmente no main. - Identificou e
// forneceu sugestões para melhorar o código referente a modularidade.

// NamingClarity - Nomes de váriaveis não indicam exatamente o proposito
// daquelas váriaveis. - Identificou e reclamou sobre o nome das váriaveis.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número (Linha 6) - Identificou, diferente do Java aqui 
// indicou a necessidade de colocar validações para verificar a entrada que o 
// usuário digitou.
