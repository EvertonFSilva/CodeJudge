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
