import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = scanner.nextInt();
        scanner.nextLine();

        String[] produtos = new String[n];
        double[] precos = new double[n];
        int[] quantidades = new int[n];

        for (int i = 0; i < n; i++) {
            produtos[i] = scanner.nextLine().toLowerCase();
            precos[i] = scanner.nextDouble();
            quantidades[i] = scanner.nextInt();
            scanner.nextLine();
        }

        for (int i = 0; i < n; i++) {
            System.out.println(
                    "Produto: " + produtos[i] + " | Preço: R$ " + precos[i] + " | Quantidade: " + quantidades[i]);
        }

        String nomeBusca = scanner.nextLine().toLowerCase();
        boolean produtoEncontrado = false;
        for (int i = 0; i < n; i++) {
            if (produtos[i].equals(nomeBusca)) {
                System.out.println("Produto encontrado: " + produtos[i] + " | Preço: R$ " + precos[i]
                        + " | Quantidade: " + quantidades[i]);
                produtoEncontrado = true;
                break;
            }
        }

        if (!produtoEncontrado) {
            System.out.println("Produto não encontrado.");
        }

        double totalEstoque = 0;
        for (int i = 0; i < n; i++) {
            totalEstoque += precos[i] * quantidades[i];
        }
        System.out.printf("\nValor total do estoque: R$ %.2f\n", totalEstoque);

        scanner.close();
    }
}