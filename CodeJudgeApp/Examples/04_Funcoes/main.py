import sys

def ehPrimo(n: int) -> bool:
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        if n == 1:
            print("NEUTRO")
        elif ehPrimo(n):
            print("PRIMO")
        else:
            print("COMPOSTO")

if __name__ == "__main__":
    main()
