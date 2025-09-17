import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        double custoFabrica, custoConsumidor;

        int escolha = scanner.nextInt();

        if (escolha == 1) {
            custoFabrica = scanner.nextDouble();
            double percentualDistribuidor = 12.0 / 100;
            double percentualImpostos = 30.0 / 100;
            double custoDistribuidor = custoFabrica * percentualDistribuidor;
            double custoImpostos = custoFabrica * percentualImpostos;
            custoConsumidor = custoFabrica + custoDistribuidor + custoImpostos;
            System.out.printf("O custo ao consumidor do carro será: R$ %.2f\n", custoConsumidor);
        } else if (escolha == 2) {
            custoConsumidor = scanner.nextDouble();
            double percentualDistribuidor = 12.0 / 100; // Aqui calcula o custo de imposto.
            double percentualImpostos = 30.0 / 100;
            double custoFabricaCalculado = custoConsumidor / (1 + percentualDistribuidor + percentualImpostos);
            System.out.printf("O custo de fábrica do carro será: R$ %.2f\n", custoFabricaCalculado);
        } else {
            System.out.println("Opção inválida.");
        }

        scanner.close();
    }
}

// Erros Detectados

// Linhas mal indentadas: 14, 19, 26
// Comentário incorreto na linha 20

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
// caso não seja um número. - Não identificou, mas variaveis globais sim.