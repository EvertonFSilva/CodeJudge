import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        double custoFabrica = scanner.nextDouble();
        double percentualDistribuidor = 12.0 / 100;
        double percentualImpostos = 30.0 / 100;
        double custoDistribuidor = custoFabrica * percentualDistribuidor;
        double custoImpostos = custoFabrica * percentualImpostos;
        double custoConsumidor = custoFabrica + custoDistribuidor + custoImpostos;
        System.out.printf("O custo ao consumidor do carro será: R$ %.2f\n", custoConsumidor);
        scanner.close();
    }
}

    

    
    
        
        
            
        
        
    

    
    
    
        
    

    
