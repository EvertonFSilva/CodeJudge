Explicação do Enunciado: Jogo da Velha

O enunciado solicita a criação de um programa para implementar o Jogo da Velha, onde dois jogadores se alternam para preencher um tabuleiro 3x3 com suas marcas: X e O. O jogo termina quando um jogador vence, ou quando todas as casas estão preenchidas, resultando em empate.

Objetivo:

O programa deve permitir que dois jogadores joguem alternadamente e, após cada jogada, o estado do tabuleiro deve ser exibido. Além disso, o programa deve verificar se há um vencedor ou se o jogo terminou em empate após cada jogada.

Regras do Jogo:

Tabuleiro: O tabuleiro é uma matriz 3x3. Cada célula pode ser preenchida com um "X", "O" ou permanecer vazia (representada por um espaço ' ').

Vencedor: O jogo termina quando um jogador consegue alinhar três de suas marcas (X ou O) em uma linha, coluna ou diagonal.

Empate: Caso todas as células do tabuleiro sejam preenchidas e não haja vencedor, o jogo termina em empate.

Jogadores: O jogo é jogado por dois jogadores, alternando entre as jogadas. O jogador "X" começa primeiro.

Funcionalidades do Programa:

Exibição do Tabuleiro: Após cada jogada, o estado atual do tabuleiro é exibido, mostrando quais posições estão ocupadas e quais estão livres.

Exibição das Posições Disponíveis: O programa exibe as coordenadas das posições disponíveis no tabuleiro, facilitando para o jogador escolher onde fazer a jogada.

Verificação de Vitória: Após cada jogada, o programa verifica se um dos jogadores formou uma linha, coluna ou diagonal com suas marcas. Se isso acontecer, o jogo termina e o vencedor é anunciado.

Verificação de Empate: Se todas as células forem preenchidas e não houver um vencedor, o programa verifica se o jogo terminou em empate.

Alternância de Jogadores: O jogo alterna entre os jogadores "X" e "O", permitindo que cada jogador faça sua jogada de forma intercalada.

Estrutura do Jogo:

Função imprimirTabuleiro(): Exibe o estado atual do tabuleiro.

Função mostrarLocaisDisponiveis(): Exibe as posições disponíveis para os jogadores escolherem.

Função verificarVencedor(): Verifica se um dos jogadores venceu.

Função verificarEmpate(): Verifica se o jogo terminou em empate.

Função fazerJogada(): Solicita e realiza a jogada de um jogador.

Função main(): Controla o fluxo do jogo, alternando entre os jogadores e verificando o resultado do jogo após cada jogada.

Entradas:

O programa solicita as coordenadas da linha e coluna onde o jogador deseja fazer sua jogada. As coordenadas devem ser inseridas dentro do intervalo de 0 a 2 (representando as linhas e colunas do tabuleiro 3x3).

Saídas:

O programa exibe o tabuleiro após cada jogada.

O programa exibe os locais disponíveis para o jogador escolher onde realizar sua jogada.

O programa exibe o vencedor assim que alguém ganhar.

O programa exibe a mensagem "Empate" se não houver vencedor após todas as jogadas.

Exemplo de Jogo:

Entrada:

Jogador X, faça sua jogada.
Locais disponíveis:
(0,0) (0,1) (0,2) (1,0) (1,1) (1,2) (2,0) (2,1) (2,2)
Escolha a linha (0-2): 1
Escolha a coluna (0-2): 1

Jogador O, faça sua jogada.
Locais disponíveis:
(0,0) (0,2) (1,0) (1,2) (2,0) (2,1) (2,2)
Escolha a linha (0-2): 0
Escolha a coluna (0-2): 0

Saída Esperada:

Tabuleiro atual:
X O X
O X O
X O X

Jogador X venceu!