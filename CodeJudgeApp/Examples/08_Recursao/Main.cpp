#include <iostream>

long long fatorial(int n) {
    if (n <= 0) return 1;
    return static_cast<long long>(n) * fatorial(n - 1);
}

long long potencia(int a, int b) {
    if (b <= 0) return 1;
    return static_cast<long long>(a) * potencia(a, b - 1);
}

int main() {
    int a, b;
    if (std::cin >> a >> b) {
        long long fat = fatorial(a);
        long long pot = potencia(a, b);
        std::cout << "Fat(" << a << ")=" << fat << " Pot(" << a << "," << b << ")=" << pot << "\n";
    }
    return 0;
}
