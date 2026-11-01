import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        parts = [int(x) for x in line.split()]
        if parts:
            n = parts[0]
            values = parts[1:n+1]
            if values:
                soma = sum(values)
                media = soma / len(values)
                maior = max(values)
                menor = min(values)
                print(f"Soma={soma} Media={media:.2f} Maior={maior} Menor={menor}")

if __name__ == "__main__":
    main()
