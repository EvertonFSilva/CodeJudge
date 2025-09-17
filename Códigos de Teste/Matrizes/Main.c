#include <stdio.h>

int main() {
    int n, m;

    scanf("%d", &n);
    scanf("%d", &m);

    char alunos[n][50];
    double notas[n][m];
    double medias[n];

    for (int i = 0; i < n; i++) {
        scanf("%s", alunos[i]);

        for (int j = 0; j < m; j++) {
            scanf("%lf", &notas[i][j]);
        }
    }

    for (int i = 0; i < n; i++) {
        double soma = 0;
        for (int j = 0; j < m; j++) {
            soma += notas[i][j];
        }
        medias[i] = soma / m;
    }

    for (int i = 0; i < n; i++) {
        fputs(alunos[i], stdout);
        fputs(": ", stdout);
        printf("%.2lf\n", medias[i]);
    }

    return 0;
}

// Erros Detectados

// CodeStructure - Separação lógica da estrutura do código. (entrada,
// processamento e saída). - Foi sugerido o cálculo da soma das notas e da média
// de cada aluno pode ser realizado no mesmo laço onde as notas são lidas.

// CodeStyle - Sugeriu apenas comentar o código, mas não tem problema de
// identação.

// Modularity - Estrutura do código está totalmente no main. Ele identificou.

// NamingClarity - Reclamou sobre os nomes das variaveis e do inglês.

// Robustness - Tem que fazer verificações de validação no código. Por exemplo,
// caso não seja um número. - Identificou - Falta de Validação de Entrada: O código não verifica o valor de retorno das chamadas scanf. Se a entrada do usuário for inválida (ex: texto onde um número é esperado para n ou m), as variáveis podem permanecer não inicializadas ou conter valores incorretos, levando a erros lógicos imprevisíveis ou falhas.
// Risco de Divisão por Zero: Não há validação para garantir que m (número de notas) seja maior que zero antes de realizar a operação soma / m. Se m for 0, o programa tentará uma divisão por zero, o que resultará em uma falha em tempo de execução.
