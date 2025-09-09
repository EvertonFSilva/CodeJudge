import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int idade = scanner.nextInt();
        char genero = scanner.next().toUpperCase().charAt(0);

        double precoBase = 500.0;
        double precoFinal;

        if (genero == 'M') {
            if (idade <= 25)
                precoFinal = precoBase * 1.4;
            else if (idade <= 31)
                precoFinal = precoBase * 1.3;
            else if (idade <= 37)
                precoFinal = precoBase * 1.2;
            else if (idade <= 44)
                precoFinal = precoBase * 1.1;
            else if (idade <= 59)
                precoFinal = precoBase * 0.9;
            else
                precoFinal = precoBase * 0.8;
        } else if (genero == 'F') {
            if (idade <= 25)
                precoFinal = precoBase * 1.3;
            else if (idade <= 31)
                precoFinal = precoBase * 1.2;
            else if (idade <= 37)
                precoFinal = precoBase * 1.1;
            else if (idade <= 44)
                precoFinal = precoBase;
            else if (idade <= 59)
                precoFinal = precoBase * 0.85;
            else
                precoFinal = precoBase * 0.75;
        } else {
            System.out.println("Gênero inválido.");
            scanner.close();
            return;
        }

        System.out.printf("Preço sugerido do seguro: R$%.2f\n", precoFinal);
        scanner.close();
    }
}