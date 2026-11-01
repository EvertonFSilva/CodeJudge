import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextDouble()) {
            double n1 = scanner.nextDouble();
            double n2 = scanner.nextDouble();
            double n3 = scanner.nextDouble();
            double media = (n1 * 2.0 + n2 * 3.0 + n3 * 5.0) / 10.0;
            if (media >= 7.0) {
                System.out.printf("APROVADO: %.2f\n", media);
            } else if (media >= 5.0) {
                System.out.printf("RECUPERACAO: %.2f\n", media);
            } else {
                System.out.printf("REPROVADO: %.2f\n", media);
            }
        }
        scanner.close();
    }
}
