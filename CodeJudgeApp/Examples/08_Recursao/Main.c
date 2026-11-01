#include <stdio.h>

long long fatorial(int n) {
    if (n <= 0) return 1;
    return (long long)n * fatorial(n - 1);
}

long long potencia(int a, int b) {
    if (b <= 0) return 1;
    return (long long)a * potencia(a, b - 1);
}

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        long long fat = fatorial(a);
        long long pot = potencia(a, b);
        printf("Fat(%d)=%lld Pot(%d,%d)=%lld\n", a, fat, a, b, pot);
    }
    return 0;
}
