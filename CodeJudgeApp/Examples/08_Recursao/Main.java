import java.util.Scanner;

public class Main {
    public static long fatorial(int n) {
        if (n <= 0) return 1;
        return (long) n * fatorial(n - 1);
    }

    public static long potencia(int a, int b) {
        if (b <= 0) return 1;
        return (long) a * potencia(a, b - 1);
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            long fat = fatorial(a);
            long pot = potencia(a, b);
            System.out.printf("Fat(%d)=%d Pot(%d,%d)=%d\n", a, fat, a, b, pot);
        }
        scanner.close();
    }
}
