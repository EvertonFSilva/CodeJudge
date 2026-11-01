import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        parts = [int(x) for x in line.split()]
        if parts:
            n = parts[0]
            elements = parts[1:1 + n * n]
            if len(elements) == n * n:
                principal = 0
                secundaria = 0
                for i in range(n):
                    for j in range(n):
                        val = elements[i * n + j]
                        if i == j:
                            principal += val
                        if i + j == n - 1:
                            secundaria += val
                print(f"Principal={principal} Secundaria={secundaria}")

if __name__ == "__main__":
    main()
