#include <stdio.h>

int main() {
    double n1, n2, n3;
    if (scanf("%lf %lf %lf", &n1, &n2, &n3) == 3) {
        double media = (n1 * 2.0 + n2 * 3.0 + n3 * 5.0) / 10.0;
        if (media >= 7.0) {
            printf("APROVADO: %.2f\n", media);
        } else if (media >= 5.0) {
            printf("RECUPERACAO: %.2f\n", media);
        } else {
            printf("REPROVADO: %.2f\n", media);
        }
    }
    return 0;
}
