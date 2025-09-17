import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = scanner.nextInt();

        int a = 0, b = 1;

        for (int i = 0; i < n; i++) {
            System.out.print(a + " ");
            int temp = a;
            a = b;
            b = temp + b;
        }

        scanner.close();
    }
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - O códgio é muito simples, então não deve apresentar
// esse tipo de problema.

// CodeStyle - As declarações de variaveis estão na mesma linha. (linha 9) - Não
// detectou apenas pediu para adicionar comentários para 10.

// Modularity - Estrutura do código está totalmente no main. - Identificou e
// forneceu sugestões para melhorar o código referente a modularidade.

// NamingClarity - Nomes de váriaveis não indicam exatamente o proposito
// daquelas váriaveis. - Identificou e reclamou sobre o nome das váriaveis.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número (Linha 7) - Não Identificou, não achou necessários
// incluir validação.