#include <stdio.h>

int main() {
    double custoFabrica;
    if (scanf("%lf", &custoFabrica) == 1) {
        double custoConsumidor = custoFabrica * 1.42;
        printf("R$ %.2f\n", custoConsumidor);
    }
    return 0;
}
