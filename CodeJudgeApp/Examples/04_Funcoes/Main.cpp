#include <iostream>

bool ehPrimo(int n) {
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

int main() {
    int n;
    if (std::cin >> n) {
        if (n == 1) {
            std::cout << "NEUTRO\n";
        } else if (ehPrimo(n)) {
            std::cout << "PRIMO\n";
        } else {
            std::cout << "COMPOSTO\n";
        }
    }
    return 0;
}
