#include <iostream>
#include <string>
#include <algorithm>
#include <cctype>

int main() {
    std::string str;
    if (std::cin >> str) {
        int len = str.length();
        std::string invertida = str;
        std::reverse(invertida.begin(), invertida.end());

        bool palindromo = true;
        for (int i = 0; i < len / 2; i++) {
            if (std::tolower(str[i]) != std::tolower(str[len - 1 - i])) {
                palindromo = false;
                break;
            }
        }

        std::cout << "Tam=" << len << " Invertida=" << invertida << " Palindromo=" << (palindromo ? "SIM" : "NAO") << "\n";
    }
    return 0;
}
