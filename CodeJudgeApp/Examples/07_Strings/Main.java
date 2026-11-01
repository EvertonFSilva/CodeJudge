import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNext()) {
            String str = scanner.next();
            int len = str.length();
            String invertida = new StringBuilder(str).reverse().toString();

            boolean palindromo = true;
            for (int i = 0; i < len / 2; i++) {
                if (Character.toLowerCase(str.charAt(i)) != Character.toLowerCase(str.charAt(len - 1 - i))) {
                    palindromo = false;
                    break;
                }
            }

            System.out.printf("Tam=%d Invertida=%s Palindromo=%s\n", len, invertida, palindromo ? "SIM" : "NAO");
        }
        scanner.close();
    }
}
