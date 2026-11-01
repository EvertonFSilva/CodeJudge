#include <iostream>
#include <iomanip>

int main() {
    int n;
    if (std::cin >> n && n >= 1) {
        long long soma = 0;
        int maior = 0, menor = 0;
        for (int i = 0; i < n; i++) {
            int val;
            std::cin >> val;
            soma += val;
            if (i == 0) {
                maior = menor = val;
            } else {
                if (val > maior) maior = val;
                if (val < menor) menor = val;
            }
        }
        double media = static_cast<double>(soma) / n;
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "Soma=" << soma << " Media=" << media << " Maior=" << maior << " Menor=" << menor << "\n";
    }
    return 0;
}
