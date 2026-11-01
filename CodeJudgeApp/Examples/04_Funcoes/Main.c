#include <stdio.h>
#include <stdbool.h>

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
    if (scanf("%d", &n) == 1) {
        if (n == 1) {
            printf("NEUTRO\n");
        } else if (ehPrimo(n)) {
            printf("PRIMO\n");
        } else {
            printf("COMPOSTO\n");
        }
    }
    return 0;
}
