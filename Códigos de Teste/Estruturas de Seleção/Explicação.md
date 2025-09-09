Explicação do Enunciado:

O enunciado solicita a criação de um algoritmo que simule o cálculo do valor de um seguro com base na idade e gênero do cliente. O programa deve aplicar regras de risco e desconto conforme faixas etárias e gênero, simulando a lógica de uma seguradora que ajusta o preço do seguro de forma personalizada.

O algoritmo deve solicitar ao usuário a idade e o gênero do cliente, e então calcular o valor final do seguro com base em percentuais definidos para cada faixa etária. A lógica será implementada utilizando estrutura de seleção, especificamente com instruções if isoladas, sem uso de else ou else if, para simular múltiplas verificações independentes.

Lógica de Cálculo:

O valor base do seguro é fixo (R$500,00). O valor final será ajustado conforme a tabela abaixo:

Faixa Etária ≤ 25:

Homem (M): +40%

Mulher (F): +30%

Faixa Etária 26–31:

Homem (M): +30%

Mulher (F): +20%

Faixa Etária 32–37:

Homem (M): +20%

Mulher (F): +10%

Faixa Etária 38–44:

Homem (M): +10%

Mulher (F): sem acréscimo

Faixa Etária 45–59:

Homem (M): -10%

Mulher (F): -15%

Faixa Etária ≥ 60:

Homem (M): -20%

Mulher (F): -25%

Entrada:

O programa solicitará ao usuário:

A idade do cliente (número inteiro)

O gênero do cliente (M para masculino ou F para feminino)

Saída:

O programa calculará e exibirá o valor final do seguro, já ajustado com base na faixa etária e no gênero informado.

Fórmulas:

precoFinal = precoBase * fatorDeAjuste

O fatorDeAjuste depende da combinação entre idade e gênero, conforme a tabela de risco.

Entradas Esperadas:

Exemplo de entrada:

Digite a idade do cliente: 28
Digite o gênero (M/F): M

Saída Esperada:

Preço sugerido do seguro: R$650.00

Passo a Passo do Cálculo para o Exemplo:

Idade = 28 → faixa 26–31

Gênero = M → acréscimo de 30%

Preço base = R$500.00

Cálculo: 500.00 * 1.3 = 650.00