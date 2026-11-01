#include <iostream>

int main() {
    int n;
    if (std::cin >> n && n >= 1) {
        long long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            if (i > 0) std::cout << " ";
            std::cout << a;
            long long temp = a + b;
            a = b;
            b = temp;
        }
        std::cout << "\n";
    }
    return 0;
}
