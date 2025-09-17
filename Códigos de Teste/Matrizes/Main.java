import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = Integer.parseInt(scanner.next());
        int m = Integer.parseInt(scanner.next());

        String[] alunos = new String[n];
        double[][] notas = new double[n][m];
        double[] medias = new double[n];

        for (int i = 0; i < n; i++) {
            alunos[i] = scanner.next().toUpperCase();

            for (int j = 0; j < m; j++) {
                notas[i][j] = Double.parseDouble(scanner.next());
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
            System.out.println(alunos[i] + ": " + medias[i]);
        }

        scanner.close();
    }
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - Foi sugerido o cálculo da soma das notas e da média
// de cada aluno pode ser realizado no mesmo laço onde as notas são lidas.

// CodeStyle - Sugeriu apenas comentar o código, mas não tem problema de
// identação.

// Modularity - Estrutura do código está totalmente no main. Ele identificou.

// NamingClarity - Reclamou sobre os nomes das variaveis e do inglês.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número. - Identificou - Ausência de Tratamento de Erros de
// Entrada: O código assume que todas as entradas serão válidas (números
// inteiros para n e m, strings para nomes e números decimais para notas). Se o
// usuário inserir um valor não numérico onde um número é esperado (ex:
// Integer.parseInt("abc")), o programa irá falhar com um NumberFormatException.
// Divisão por Zero Potencial: Não há verificação se m (número de notas) é zero.
// Se m for 0, a operação soma / m resultará em um ArithmeticException (divisão
// por zero), causando a falha do programa.
