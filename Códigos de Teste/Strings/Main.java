#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main() {
    char input[100], invertida[100], letra;
    int comprimento, contagem = 0, i;

    scanf("%s", input);

    comprimento = strlen(input);
    printf("Comprimento da string: %d\n", comprimento);

    for (i = 0; i < comprimento; i++) {
        invertida[i] = input[comprimento - 1 - i];
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

    scanf(" %c", &letra); 
    for (i = 0; i < comprimento; i++) {
        if (input[i] == letra) {
            contagem++;
        }
    }
    printf("A letra '%c' ocorre %d vezes na string.\n", letra, contagem);

    return 0;
}