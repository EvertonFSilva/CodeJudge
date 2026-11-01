#include <iostream>
#include <iomanip>

int main() {
    double n1, n2, n3;
    if (std::cin >> n1 >> n2 >> n3) {
        double media = (n1 * 2.0 + n2 * 3.0 + n3 * 5.0) / 10.0;
        std::cout << std::fixed << std::setprecision(2);
        if (media >= 7.0) {
            std::cout << "APROVADO: " << media << "\n";
        } else if (media >= 5.0) {
            std::cout << "RECUPERACAO: " << media << "\n";
        } else {
            std::cout << "REPROVADO: " << media << "\n";
        }
    }
    return 0;
}
