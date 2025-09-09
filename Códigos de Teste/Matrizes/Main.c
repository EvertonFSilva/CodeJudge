#include <stdio.h>

int main() {
    int n, m;

    scanf("%d", &n);
    scanf("%d", &m);

    char alunos[n][50];
    double notas[n][m];
    double medias[n];

    for (int i = 0; i < n; i++) {
        scanf("%s", alunos[i]);

        for (int j = 0; j < m; j++) {
            scanf("%lf", &notas[i][j]);
        }
    }

    for (int i = 0; i < n; i++) {
        double soma = 0;
        for (int j = 0; j < m; j++) {
            soma += notas[i][j];
        }
        medias[i] = soma / m;
    }

    for (int i = 0; i < n; i++) {
        fputs(alunos[i], stdout);
        fputs(": ", stdout);
        printf("%.2lf\n", medias[i]);
    }

    return 0;
}