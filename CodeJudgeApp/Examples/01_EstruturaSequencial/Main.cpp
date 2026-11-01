#include <iostream>
#include <iomanip>

int main() {
    double custoFabrica;
    if (std::cin >> custoFabrica) {
        double custoConsumidor = custoFabrica * 1.42;
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "R$ " << custoConsumidor << "\n";
    }
    return 0;
}
