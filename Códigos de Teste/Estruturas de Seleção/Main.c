#include <stdio.h>
#include <ctype.h>

int main() {
    int idade;
    char genero;
    double precoBase = 500.0;
    double precoFinal;

    scanf("%d", &idade);
    scanf(" %c", &genero);
    genero = toupper(genero);

    if (genero == 'M') {
        if (idade <= 25) precoFinal = precoBase * 1.4;
        if (idade > 25 && idade <= 31) precoFinal = precoBase * 1.3;
        if (idade > 31 && idade <= 37) precoFinal = precoBase * 1.2;
        if (idade > 37 && idade <= 44) precoFinal = precoBase * 1.1;
        if (idade > 44 && idade <= 59) precoFinal = precoBase * 0.9;
        if (idade > 59) precoFinal = precoBase * 0.8;
    } 
    if (genero == 'F') {
        if (idade <= 25) precoFinal = precoBase * 1.3;
        if (idade > 25 && idade <= 31) precoFinal = precoBase * 1.2;
        if (idade > 31 && idade <= 37) precoFinal = precoBase * 1.1;
        if (idade > 37 && idade <= 44) precoFinal = precoBase;
        if (idade > 44 && idade <= 59) precoFinal = precoBase * 0.85;
        if (idade > 59) precoFinal = precoBase * 0.75;
    } 

    if (genero != 'M' && genero != 'F') {
        printf("Gênero inválido.\n");
        return 1;
    }

    printf("Preço sugerido do seguro: R$%.2f\n", precoFinal);
    return 0;
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - Identificou: Uso Redundante de if ao Invés de
// if-else if e Validação de Entrada Tardía, ou seja, ele verifica o genero
// depois de já ter executado toda a lógica.

// CodeStyle - Foi identificado a falta de {} chaves quando você utiliza o if
// com apenas 1 unica linha e também falta de comentários no código

// Modularity - Estrutura do código está totalmente no main. Foi recomendado
// separar as lógicas do código em várias funções.

// NamingClarity - Nomes de váriaveis não indicam exatamente o proposito
// daquelas váriaveis. - Não identificou, pq os nomes já são claros.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número. - Não identificou, o unico erro identificado foi do
// if-else.