#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

int main() {
    char str[1024];
    if (scanf("%1023s", str) == 1) {
        int len = strlen(str);
        char invertida[1024];
        for (int i = 0; i < len; i++) {
            invertida[i] = str[len - 1 - i];
        }
        invertida[len] = '\0';

        bool palindromo = true;
        for (int i = 0; i < len / 2; i++) {
            if (tolower((unsigned char)str[i]) != tolower((unsigned char)str[len - 1 - i])) {
                palindromo = false;
                break;
            }
        }

        printf("Tam=%d Invertida=%s Palindromo=%s\n", len, invertida, palindromo ? "SIM" : "NAO");
    }
    return 0;
}
