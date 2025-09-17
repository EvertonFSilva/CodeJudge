import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        String input = scanner.next();
        int comprimento = input.length();

        System.out.println("Comprimento da string: " + comprimento);

        StringBuilder invertida = new StringBuilder(input);
        invertida.reverse();
        System.out.println("String invertida: " + invertida);

        boolean palindromo = true;
        for (int i = 0; i < comprimento; i++) {
            if (Character.toLowerCase(input.charAt(i)) != Character.toLowerCase(invertida.charAt(i))) {
                palindromo = false;
                break;
            }
        }
        if (palindromo) {
            System.out.println("A string é um palíndromo.");
        } else {
            System.out.println("A string não é um palíndromo.");
        }

        char letra = scanner.next().charAt(0);
        int contagem = 0;
        for (int i = 0; i < comprimento; i++) {
            if (input.charAt(i) == letra) {
                contagem++;
            }
        }
        System.out.println("A letra '" + letra + "' ocorre " + contagem + " vezes na string.");

        scanner.close();
    }
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - Foi sugerido trocar a linha que verifica se é
// padidromo por uma função nativa do java chamada de equalsIgnoreCase

// CodeStyle - Sugeriu apenas comentar o código, mas não tem problema de
// identação.

// Modularity - Estrutura do código está totalmente no main. Ele identificou.

// NamingClarity - Apenas recomendou usar inglês.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número. - Não identificou
