#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n >= 1) {
        long long soma = 0;
        int maior, menor;
        for (int i = 0; i < n; i++) {
            int val;
            scanf("%d", &val);
            soma += val;
            if (i == 0) {
                maior = menor = val;
            } else {
                if (val > maior) maior = val;
                if (val < menor) menor = val;
            }
        }
        double media = (double)soma / n;
        printf("Soma=%lld Media=%.2f Maior=%d Menor=%d\n", soma, media, maior, menor);
    }
    return 0;
}
