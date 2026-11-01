import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        custoFabrica = float(line)
        custoConsumidor = custoFabrica * 1.42
        print(f"R$ {custoConsumidor:.2f}")

if __name__ == "__main__":
    main()
