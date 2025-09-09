#include <stdio.h>

int main() {
    double custoFabrica, custoDistribuidor, custoImpostos, custoConsumidor;
    scanf("%lf", &custoFabrica);
    custoDistribuidor = custoFabrica * 12.0 / 100;
    custoImpostos = custoFabrica * 30.0 / 100;
    custoConsumidor = custoFabrica + custoDistribuidor + custoImpostos;
    printf("O custo ao consumidor do carro será: R$ %.2f\n", custoConsumidor);
    return 0;
}