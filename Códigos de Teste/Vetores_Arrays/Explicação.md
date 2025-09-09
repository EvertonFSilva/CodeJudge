O enunciado descreve um controle de estoque de uma loja. O objetivo é criar um programa que:

Cadastrar produtos: O programa deve permitir ao usuário inserir informações sobre produtos, incluindo o nome, o preço e a quantidade disponível em estoque.

Listar produtos: O programa deve ser capaz de listar todos os produtos cadastrados, mostrando nome, preço e quantidade.

Buscar produto por nome: O programa deve permitir ao usuário buscar por um produto específico, exibindo suas informações caso ele exista no estoque.

Calcular o valor total do estoque: O programa deve calcular e exibir o valor total do estoque, que é a soma dos valores de todos os produtos (preço * quantidade).

Etapas do Algoritmo:

Cadastrar produtos:

O programa solicita ao usuário o número de produtos a serem cadastrados.

Para cada produto, o usuário informa o nome, o preço e a quantidade disponível.

Essas informações são armazenadas em três vetores: um para os nomes dos produtos, outro para os preços e outro para as quantidades.

Listar produtos:

O programa exibe a lista de todos os produtos cadastrados, mostrando o nome, o preço e a quantidade de cada um.

Buscar produto por nome:

O programa permite que o usuário pesquise por um produto digitando seu nome.

O nome informado pelo usuário é comparado com os nomes dos produtos cadastrados (ignorando diferenças entre maiúsculas e minúsculas), e as informações do produto correspondente são exibidas.

Calcular o total do estoque:

O programa calcula o valor total do estoque somando o valor de cada produto (preço * quantidade).

Esse valor total é exibido ao final.

Fórmulas/Operações:

Valor total de um produto: Valor = preço * quantidade

Valor total do estoque: Soma de todos os valores dos produtos cadastrados no estoque.

Entradas Esperadas:

O programa solicita o número de produtos no estoque.

Para cada produto, o programa solicita:

O nome do produto.

O preço do produto.

A quantidade do produto.

O programa também solicita o nome de um produto para busca.

Saídas Esperadas:

O programa exibe a lista de todos os produtos cadastrados, com seus respectivos preços e quantidades.

Se o produto buscado for encontrado, o programa exibe suas informações (nome, preço e quantidade). Caso contrário, informa que o produto não foi encontrado.

O programa exibe o valor total do estoque.

Exemplo:

Entrada:

Digite o número de produtos no estoque: 3
Digite o nome do produto 1: Produto A
Digite o preço do produto 1: 50
Digite a quantidade do produto 1: 10
Digite o nome do produto 2: Produto B
Digite o preço do produto 2: 30
Digite a quantidade do produto 2: 5
Digite o nome do produto 3: Produto C
Digite o preço do produto 3: 100
Digite a quantidade do produto 3: 2
Digite o nome do produto para buscar: produto b

Saída Esperada:

Produtos cadastrados:
Produto: produto a | Preço: R$ 50.00 | Quantidade: 10
Produto: produto b | Preço: R$ 30.00 | Quantidade: 5
Produto: produto c | Preço: R$ 100.00 | Quantidade: 2

Produto encontrado: produto b | Preço: R$ 30.00 | Quantidade: 5

Valor total do estoque: R$ 650.00

Passo a Passo do Cálculo para o Exemplo:

Produto A: 50 * 10 = 500

Produto B: 30 * 5 = 150

Produto C: 100 * 2 = 200

Valor total do estoque: 500 + 150 + 200 = 650

Assim, o valor total do estoque é R$ 650.00.