import sys

def fatorial(n: int) -> int:
    if n <= 0:
        return 1
    return n * fatorial(n - 1)

def potencia(a: int, b: int) -> int:
    if b <= 0:
        return 1
    return a * potencia(a, b - 1)

def main():
    line = sys.stdin.read().strip()
    if line:
        parts = [int(x) for x in line.split()]
        if len(parts) >= 2:
            a, b = parts[0], parts[1]
            fat = fatorial(a)
            pot = potencia(a, b)
            print(f"Fat({a})={fat} Pot({a},{b})={pot}")

if __name__ == "__main__":
    main()
