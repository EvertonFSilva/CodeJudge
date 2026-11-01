import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            long a = 0, b = 1;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                if (i > 0) sb.append(" ");
                sb.append(a);
                long temp = a + b;
                a = b;
                b = temp;
            }
            System.out.println(sb.toString());
        }
        scanner.close();
    }
}
