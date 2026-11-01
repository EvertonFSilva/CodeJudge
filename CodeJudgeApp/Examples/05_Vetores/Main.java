import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Locale.setDefault(Locale.US);
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            long soma = 0;
            int maior = 0, menor = 0;
            for (int i = 0; i < n; i++) {
                int val = scanner.nextInt();
                soma += val;
                if (i == 0) {
                    maior = menor = val;
                } else {
                    if (val > maior) maior = val;
                    if (val < menor) menor = val;
                }
            }
            double media = (double) soma / n;
            System.out.printf("Soma=%d Media=%.2f Maior=%d Menor=%d\n", soma, media, maior, menor);
        }
        scanner.close();
    }
}
