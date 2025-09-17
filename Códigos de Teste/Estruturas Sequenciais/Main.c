#include <stdio.h>

int main() {
    double custoFabrica, custoDistribuidor, custoImpostos, custoConsumidor;
    int escolha;
    
    scanf("%d", &escolha);

    if (escolha == 1) {
        scanf("%lf", &custoFabrica);
        custoDistribuidor = custoFabrica * 12.0 / 100;
    custoImpostos = custoFabrica * 30.0 / 100;
        custoConsumidor = custoFabrica + custoDistribuidor + custoImpostos;
        printf("O custo ao consumidor do carro será: R$ %.2f\n", custoConsumidor);
    } else if (escolha == 2) {
                scanf("%lf", &custoConsumidor);
        custoFabrica = custoConsumidor / (1 + 12.0 / 100 + 30.0 / 100); // Aqui calcula o custo de imposto.
        printf("O custo de fábrica do carro será: R$ %.2f\n", custoFabrica);
    } else {
                    printf("Opção inválida.\n");
    }

    return 0;
}

// Erros Detectados

// Linhas mal indentadas: 12, 16, 20
// Comentário Incorreto - Linha 17

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - Declaração a mais de variavel sem necessidade, por
// exemplo, repetir duas vezes percentualDistribuidor, etc. E o comentário
// proposital na linha 20 é incosistente.

// CodeStyle - Identificou erros de identação no codigo colocados
// propositalmente.

// Modularity - Estrutura do código está totalmente no main. - Identificou

// NamingClarity - Não identificou, pq os nomes já são claros, mas Constantes
// não declaradas: Os valores 12.0 / 100 e 30.0 / 100 são "números mágicos" que
// representam percentuais fixos.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número. - Identificou.