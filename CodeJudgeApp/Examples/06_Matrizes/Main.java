import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            long principal = 0;
            long secundaria = 0;
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    int val = scanner.nextInt();
                    if (i == j) {
                        principal += val;
                    }
                    if (i + j == n - 1) {
                        secundaria += val;
                    }
                }
            }
            System.out.printf("Principal=%d Secundaria=%d\n", principal, secundaria);
        }
        scanner.close();
    }
}
