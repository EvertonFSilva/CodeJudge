#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n >= 1) {
        long long principal = 0;
        long long secundaria = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int val;
                scanf("%d", &val);
                if (i == j) {
                    principal += val;
                }
                if (i + j == n - 1) {
                    secundaria += val;
                }
            }
        }
        printf("Principal=%lld Secundaria=%lld\n", principal, secundaria);
    }
    return 0;
}
