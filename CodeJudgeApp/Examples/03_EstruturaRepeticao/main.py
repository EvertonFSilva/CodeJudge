import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        a, b = 0, 1
        result = []
        for _ in range(n):
            result.append(str(a))
            a, b = b, a + b
        print(" ".join(result))

if __name__ == "__main__":
    main()
