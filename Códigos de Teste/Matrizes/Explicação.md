Explicação do Enunciado:

O enunciado solicita a criação de um algoritmo que utilize matrizes para registrar as notas de alunos em diferentes disciplinas e, a partir disso, realizar algumas operações:

Cadastro de Notas:

O programa solicita ao usuário o número de alunos e disciplinas.

Para cada aluno, o programa registra o nome e as notas em cada disciplina.

As notas dos alunos são armazenadas em uma matriz de notas, onde as linhas representam os alunos e as colunas representam as disciplinas.

Cálculo da Média de Cada Aluno:

Após inserir as notas, o programa calcula a média de cada aluno, somando as notas das disciplinas e dividindo pelo número de disciplinas.

As médias dos alunos são armazenadas em um vetor à parte.

Identificação da Maior e Menor Média:

O programa calcula e exibe as maiores e menores médias entre todos os alunos.

Identificação da Nota Mais Repetida:

O programa identifica a nota que mais se repetiu entre todos os alunos e todas as disciplinas, contando quantas vezes cada nota aparece.

A nota mais repetida é então exibida com a quantidade de vezes que ela ocorreu.

Etapas do Algoritmo:

Cadastro de Alunos e Notas:

O usuário é solicitado a inserir o número de alunos e disciplinas.

Para cada aluno, o nome é registrado e as notas das disciplinas são inseridas.

As notas são armazenadas em uma matriz de notas, onde cada linha é um aluno e cada coluna é uma disciplina.

Cálculo das Médias:

Para cada aluno, as notas das disciplinas são somadas e divididas pelo número de disciplinas para calcular a média.

As médias são armazenadas em um vetor e exibidas para cada aluno.

Cálculo da Maior e Menor Média:

O programa percorre o vetor de médias e determina qual é a maior e qual é a menor média.

Identificação da Nota Mais Repetida:

O programa percorre todas as notas inseridas e conta quantas vezes cada nota se repete.

A nota que mais se repete é identificada e o programa exibe essa nota junto com a quantidade de ocorrências.

Entradas Esperadas:

O programa solicita ao usuário:

O número de alunos.

O número de disciplinas.

Para cada aluno:

O nome do aluno.

As notas do aluno em cada disciplina.

Após a entrada das notas, o programa:

Exibe a média de cada aluno.

Exibe a maior e menor média.

Exibe a nota mais repetida e o número de vezes que ela apareceu.

Saídas Esperadas:

O programa exibe a média de cada aluno, calculada com base nas notas fornecidas.

O programa exibe a maior média e a menor média entre os alunos.

O programa exibe a nota mais repetida e o número de ocorrências dessa nota entre todos os alunos e disciplinas.

Exemplo de Entrada e Saída:

Entrada:

Digite o número de alunos: 3
Digite o número de disciplinas: 4
Digite o nome do aluno 1: João
Digite as notas de JOÃO:
Nota da disciplina 1: 7.0
Nota da disciplina 2: 8.5
Nota da disciplina 3: 6.0
Nota da disciplina 4: 9.0
Digite o nome do aluno 2: Maria
Digite as notas de MARIA:
Nota da disciplina 1: 5.0
Nota da disciplina 2: 6.5
Nota da disciplina 3: 7.0
Nota da disciplina 4: 8.0
Digite o nome do aluno 3: Pedro
Digite as notas de PEDRO:
Nota da disciplina 1: 9.5
Nota da disciplina 2: 9.0
Nota da disciplina 3: 8.5
Nota da disciplina 4: 10.0

Saída Esperada:

Médias dos alunos:
JOÃO: 7.88
MARIA: 6.88
PEDRO: 9.25

Maior média: 9.25
Menor média: 6.88

A nota que mais se repetiu foi: 7.00 com 2 ocorrências.

Passo a Passo do Cálculo para o Exemplo:

JOÃO: (7.0 + 8.5 + 6.0 + 9.0) / 4 = 7.875

MARIA: (5.0 + 6.5 + 7.0 + 8.0) / 4 = 6.875

PEDRO: (9.5 + 9.0 + 8.5 + 10.0) / 4 = 9.25

Maior média: 9.25
Menor média: 6.88

Nota mais repetida: 7.0 (aparece 2 vezes).