#include <stdio.h>

int main() {
    int n, a = 0, b = 1, i, temp;

    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        printf("%d ", a);
        temp = a;
        a = b;
        b = temp + b;
    }

    return 0;
}
