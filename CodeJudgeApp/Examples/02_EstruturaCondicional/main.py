import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        parts = line.split()
        if len(parts) >= 3:
            n1 = float(parts[0])
            n2 = float(parts[1])
            n3 = float(parts[2])
            media = (n1 * 2.0 + n2 * 3.0 + n3 * 5.0) / 10.0
            if media >= 7.0:
                print(f"APROVADO: {media:.2f}")
            elif media >= 5.0:
                print(f"RECUPERACAO: {media:.2f}")
            else:
                print(f"REPROVADO: {media:.2f}")

if __name__ == "__main__":
    main()
