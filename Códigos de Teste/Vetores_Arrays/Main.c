#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX 100

void toLowerCase(char str[]) {
    for (int i = 0; str[i]; i++) {
        str[i] = tolower(str[i]);
    }
}

int main() {
    int n;
    char produtos[MAX][100];
    double precos[MAX];
    int quantidades[MAX];
    char nomeBusca[100];
    int i, produtoEncontrado = 0;
    double totalEstoque = 0;

    scanf("%d", &n);
    getchar();

    for (i = 0; i < n; i++) {
        fgets(produtos[i], 100, stdin);
        produtos[i][strcspn(produtos[i], "\n")] = 0;
        toLowerCase(produtos[i]);
        scanf("%lf", &precos[i]);
        scanf("%d", &quantidades[i]);
        getchar();
    }

    for (i = 0; i < n; i++) {
        printf("Produto: %s | Preço: R$ %.2f | Quantidade: %d\n", produtos[i], precos[i], quantidades[i]);
    }

    fgets(nomeBusca, 100, stdin);
    nomeBusca[strcspn(nomeBusca, "\n")] = 0;
    toLowerCase(nomeBusca);

    for (i = 0; i < n; i++) {
        if (strcmp(produtos[i], nomeBusca) == 0) {
            printf("Produto encontrado: %s | Preço: R$ %.2f | Quantidade: %d\n", produtos[i], precos[i], quantidades[i]);
            produtoEncontrado = 1;
            break;
        }
    }

    if (!produtoEncontrado) {
        printf("Produto não encontrado.\n");
    }

    for (i = 0; i < n; i++) {
        totalEstoque += precos[i] * quantidades[i];
    }
    printf("\nValor total do estoque: R$ %.2f\n", totalEstoque);

    return 0;
}