#include <iostream>

int main() {
    int n;
    if (std::cin >> n && n >= 1) {
        long long principal = 0;
        long long secundaria = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int val;
                std::cin >> val;
                if (i == j) {
                    principal += val;
                }
                if (i + j == n - 1) {
                    secundaria += val;
                }
            }
        }
        std::cout << "Principal=" << principal << " Secundaria=" << secundaria << "\n";
    }
    return 0;
}
