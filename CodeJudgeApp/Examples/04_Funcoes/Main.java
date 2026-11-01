import java.util.Scanner;

public class Main {
    public static boolean ehPrimo(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            if (n == 1) {
                System.out.println("NEUTRO");
            } else if (ehPrimo(n)) {
                System.out.println("PRIMO");
            } else {
                System.out.println("COMPOSTO");
            }
        }
        scanner.close();
    }
}
