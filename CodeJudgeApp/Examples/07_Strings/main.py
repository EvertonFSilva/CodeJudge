import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        word = line.split()[0]
        length = len(word)
        inverted = word[::-1]
        isPalindrome = "SIM" if word.lower() == inverted.lower() else "NAO"
        print(f"Tam={length} Invertida={inverted} Palindromo={isPalindrome}")

if __name__ == "__main__":
    main()
