#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main() {
    char input[100], invertida[100], letra;
    int comprimento, contagem = 0, i, j;

    printf("Digite uma string: ");
    fgets(input, 100, stdin);

    input[strcspn(input, "\n")] = 0;

    comprimento = strlen(input);
    printf("Comprimento da string: %d\n", comprimento);

    for (i = 0, j = comprimento - 1; j >= 0; j--, i++) {
        invertida[i] = input[j];
    }
    invertida[i] = '\0';
    printf("String invertida: %s\n", invertida);

    int palindromo = 1;
    for (i = 0; i < comprimento; i++) {
        if (tolower(input[i]) != tolower(invertida[i])) {
            palindromo = 0;
            break;
        }
    }
    if (palindromo) {
        printf("A string é um palíndromo.\n");
    } else {
        printf("A string não é um palíndromo.\n");
    }

    printf("Digite a letra para contar as ocorrências: ");
    scanf("%c", &letra);
    for (i = 0; i < comprimento; i++) {
        if (input[i] == letra) {
            contagem++;
        }
    }
    printf("A letra '%c' ocorre %d vezes na string.\n", letra, contagem);

    return 0;
}
