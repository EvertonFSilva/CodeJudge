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

    switch (genero) {
        case 'M':
            if (idade <= 25) precoFinal = precoBase * 1.4;
            else if (idade <= 31) precoFinal = precoBase * 1.3;
            else if (idade <= 37) precoFinal = precoBase * 1.2;
            else if (idade <= 44) precoFinal = precoBase * 1.1;
            else if (idade <= 59) precoFinal = precoBase * 0.9;
            else precoFinal = precoBase * 0.8;
            break;
        case 'F':
            if (idade <= 25) precoFinal = precoBase * 1.3;
            else if (idade <= 31) precoFinal = precoBase * 1.2;
            else if (idade <= 37) precoFinal = precoBase * 1.1;
            else if (idade <= 44) precoFinal = precoBase;
            else if (idade <= 59) precoFinal = precoBase * 0.85;
            else precoFinal = precoBase * 0.75;
            break;
        default:
            printf("Gênero inválido.\n");
            return 1;
    }

    printf("Preço sugerido do seguro: R$%.2f\n", precoFinal);
    return 0;
}