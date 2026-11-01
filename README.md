# CodeJudge - Plataforma de Avaliação de Código & Assistência com IA

Plataforma educacional e profissional modular para **compilação, execução, diagnóstico de erros, análise técnica e otimização de desempenho** de código-fonte em tempo real. Desenvolvido por **Everton**.

O ecossistema integra um **backend robusto em Python (FastAPI)** estruturado estritamente segundo a **Clean Architecture** e uma **extensão interativa para o Visual Studio Code (TypeScript)** que apoia estudantes e desenvolvedores no autoaperfeiçoamento contínuo.

---

## Sumário
1. [Visão Geral do Ecossistema](#visão-geral-do-ecossistema)
2. [Arquitetura do Backend (CodeJudgeApp)](#arquitetura-do-backend-codejudgeapp)
3. [Padrões de Projeto Aplicados](#padrões-de-projeto-aplicados)
4. [A Extensão do Visual Studio Code](#a-extensão-do-visual-studio-code)
5. [Suíte de Exemplos para Testes (Examples)](#suíte-de-exemplos-para-testes-examples)
6. [Pré-requisitos](#pré-requisitos)
7. [Como Executar](#como-executar)
8. [Documentação dos Endpoints da API](#documentação-dos-endpoints-da-api)
9. [Configuração Dinâmica (Configuration.json)](#configuração-dinâmica-configurationjson)
10. [Diretrizes de Feedback e Aprendizado](#diretrizes-de-feedback-e-aprendizado)
11. [Autor e Licença](#autor-e-licença)

---

## Visão Geral do Ecossistema

O repositório é composto por módulos independentes e desacoplados:

- **`CodeJudgeApp/`**: Backend em FastAPI rodando na porta **8000**. Processa a compilação, execução isolada em sandbox, diagnósticos formativos de erros, relatórios de boas práticas e otimização assintótica com IA (Gemini ou Ollama local).
- **`CodeJudgeApp/Examples/`**: Coleção de exercícios divididos por categorias algorítmicas com código em 4 linguagens (**C, C++, Java e Python**), acompanhados de arquivos `.txt` de entrada (`inputs.txt`) e saída esperada (`outputs.txt`) prontos para uso no runner de testes da extensão.
- **`CodeJudgeExtension/`**: Extensão para o VS Code desenvolvida em TypeScript. Fornece interface Webview lateral, identificação automática de linguagens a partir do arquivo aberto no editor, sincronização dinâmica com o backend (`/languages`), validação automatizada de casos de teste (`inputs.txt` e `outputs.txt`), visualizador de relatórios em Markdown e exportação de relatórios técnicos em PDF.
- **`CodeJudgeWeb/`**: Aplicação Web unificada desenvolvida em **React 18**, **TypeScript**, **Bootstrap 5** e servidor **Express/Node.js** (porta **5000**). Unifica a autenticação institucional via **Moodle IFFar / IFF**, bancada de execução/compilação de código com sincronização de linguagens (`/languages`), runner de testes com suporte a `inputs.txt` e `outputs.txt`, feedback conceitual com IA, catálogo de 20 templates de prompts com busca/filtros, tela de perfil do aluno e exportação de relatórios em PDF.


---

## Arquitetura do Backend (CodeJudgeApp)

O **CodeJudgeApp** segue rigorosamente a **Clean Architecture** (Arquitetura Limpa), dividida em camadas concêntricas onde as dependências apontam sempre para o domínio:

```
CodeJudgeApp/
├── Configuration.json                 # Configuração de motores de IA, comandos e flags de linguagens
├── Main.py                            # Composition Root (Injeção de dependências e inicialização)
│
├── Domain/                            # Núcleo de Domínio (Regras corporativas puras)
│   ├── Contracts/                     # Interfaces/Abstrações puras
│   │   ├── IAiEngine.py               # Contrato genérico para qualquer motor de inteligência artificial
│   │   ├── ICompiler.py               # Contrato de estratégia de compilação
│   │   ├── ICompilerRegistry.py       # Contrato de registro e consulta de compiladores
│   │   ├── IExecutor.py               # Contrato de estratégia de execução
│   │   ├── IExecutorRegistry.py       # Contrato de registro e consulta de executores
│   │   ├── ILanguageRepository.py     # Contrato para consulta e suporte a linguagens
│   │   └── IPromptRepository.py       # Contrato para recuperação de templates de IA
│   ├── Entities/                      # Entidades e Value Objects
│   │   ├── ExecutionMetrics.py        # Métricas de tempo e consumo de CPU
│   │   ├── ExecutionWorkspace.py      # Sandbox de disco com padrão Context Manager
│   │   ├── Feedback.py                # Objeto de feedback avaliativo
│   │   ├── Language.py                # Entidade de linguagem e detecção de entrypoint (AST)
│   │   ├── PromptBuilder.py           # Builder Pattern para montagem fluente de prompts
│   │   ├── PromptDocument.py          # Documento de template com metadados
│   │   ├── ScenarioOutcome.py         # Resultado de execução de um cenário de teste
│   │   ├── SourceCode.py              # Código-fonte, extensão e metadados sintáticos
│   │   └── TestScenario.py            # Caso de teste (entrada stdin e saída esperada)
│   ├── Exceptions/                    # Exceções especializadas de domínio
│   │   └── DomainException.py         # Hierarquia de exceções de negócio
│   └── Reports/                       # Resultados tipados de operações
│       ├── AnalysisReport.py
│       ├── CompilationReport.py
│       ├── ExecutionReport.py
│       └── OptimizationReport.py
│
├── Application/                       # Casos de Uso (Orquestração de regras da aplicação)
│   └── UseCases/
│       ├── AnalyzeCodeUseCase.py      # Análise de qualidade, manutenibilidade e segurança
│       ├── CompileCodeUseCase.py      # Compilação de código com integração a diagnóstico
│       ├── DiagnoseErrorUseCase.py    # Módulo autônomo de diagnóstico de erros (Socrático)
│       ├── ExecuteCodeUseCase.py      # Pipeline de compilação prévia e execução com cenários
│       ├── HealthUseCase.py           # Verificação de integridade dos compiladores e da IA
│       ├── OptimizeCodeUseCase.py     # Análise de complexidade assintótica e memória
│       └── PromptUseCase.py           # Listagem e consulta de templates de prompts
│
├── Infrastructure/                    # Adaptadores Externos e Implementações de E/S
│   ├── Compilers/
│   │   └── ConfigurableCompiler.py    # Implementação genérica de compilação via Configuration.json
│   ├── Config/
│   │   └── ConfigurationManager.py    # Implementação de ILanguageRepository via Configuration.json
│   ├── Engines/                       # Adaptadores de motores de Inteligência Artificial
│   │   ├── GeminiAdapter.py           # Conexão com Google GenAI (Gemini 2.5)
│   │   └── OllamaAdapter.py           # Conexão HTTP REST com Ollama local
│   ├── Executors/
│   │   └── ConfigurableExecutor.py    # Implementação de execução com timeout e captura de I/O
│   ├── Factories/
│   │   └── EngineFactory.py           # Carregamento dinâmico de IA via reflexão (importlib)
│   ├── Logging/
│   │   └── Logger.py                  # Singleton thread-safe de logging estruturado
│   ├── Registries/
│   │   ├── CompilerRegistry.py        # Implementação de ICompilerRegistry
│   │   └── ExecutorRegistry.py        # Implementação de IExecutorRegistry
│   ├── Repositories/
│   │   └── FilePromptRepository.py    # Leitor de templates em Markdown (.md)
│   └── Templates/                     # 20 templates em Markdown categorizados
│       ├── Analysis/                  # CodeStyle, ControlFlow, Modularity, etc.
│       ├── Compilation/               # BuildFlags, CompilerDiagnostics
│       ├── Error/                     # Compilation, Execution, LogicMismatch
│       ├── Execution/                 # IoHandling, PerformanceProfiling
│       └── Optimization/              # AlgorithmEfficiency, DataStructures, Memory, etc.
│
├── Presentation/                      # Camada de Entrada e Apresentação (HTTP / FastAPI)
│   ├── Controllers/                   # Controllers desacoplados por caso de uso
│   ├── Routers/                       # Fábricas de rotas que injetam controllers via closure
│   └── Schemas/                       # Modelos Pydantic de entrada e saída (DTOs)
│       ├── Requests/
│       └── Responses/
│
└── Examples/                          # Suíte de testes e exercícios em C, C++, Java e Python
```

---

## Padrões de Projeto Aplicados

1. **Inversion of Control & Dependency Inversion Principle (DIP):**
   - Os Casos de Uso dependem exclusivamente de contratos do Domínio (`ILanguageRepository`, `ICompilerRegistry`, `IExecutorRegistry`, `IAiEngine`, `IPromptRepository`). A camada `Application` possui **zero referências** à `Infrastructure`.
2. **Builder Pattern (`PromptBuilder`):**
   - Montagem fluente de prompts para os modelos de IA, garantindo isolamento de instruções, declaração clara de código com syntax highlighting e injeção de erros sem duplicação de strings.
3. **Módulo de Diagnóstico de Erro Isolado (`DiagnoseErrorUseCase`):**
   - A geração de feedback para falhas não é uma rotina privada interna; é um caso de uso autônomo. `CompileCodeUseCase` e `ExecuteCodeUseCase` colaboram com ele, e a API disponibiliza uma rota direta (`/diagnostic/run`).
4. **Strategy & Registry Patterns:**
   - Compiladores e executores implementam as interfaces `ICompiler` e `IExecutor`, sendo selecionados em tempo de execução via `CompilerRegistry` e `ExecutorRegistry` conforme a linguagem requisitada.
5. **Adapter & Factory Patterns:**
   - Motores de IA implementam `IAiEngine` (`GeminiAdapter`, `OllamaAdapter`). A classe `EngineFactory` utiliza reflexão dinâmica (`importlib`) a partir do `Configuration.json`, sem condicionais ou fallbacks fixos.
6. **Context Manager Pattern:**
   - A classe `ExecutionWorkspace` implementa `__enter__` e `__exit__`, garantindo a criação de ambientes temporários isolados em sandbox e sua remoção determinística após a execução.
7. **Pipeline / Orchestrator Pattern:**
   - `ExecuteCodeUseCase` orquestra o fluxo sequencial: Validação $\rightarrow$ Compilação Prévia $\rightarrow$ Execução de Test Cases $\rightarrow$ Diagnóstico de Divergência/Falha $\rightarrow$ Descarte do Sandbox.
8. **Composition Root Pattern:**
   - O arquivo `Main.py` atua como a raiz única de composição, instanciando todas as dependências e repassando-as aos controllers e rotas.

---

## A Extensão do Visual Studio Code

A extensão foi projetada para transformar o editor em uma central completa de feedback de código:

- **Painel Lateral Integrado (Webview):**
  - Campo opcional para enunciado da tarefa.
  - Seleção de ações: **Executar**, **Compilar**, **Analisar** ou **Otimizar**.
  - Dropdown dinâmico de prompts (carregado via `/prompts/all`).
- **Runner de Testes Automatizados:**
  - Permite fazer upload de arquivos `.txt` de entrada (`inputs.txt`) e de saída esperada (`outputs.txt`).
  - Executa cada linha como um teste independente, calculando a taxa percentual de sucesso (ex: `100% - Passou`).
  - Apresenta tabela comparativa de Entrada, Saída Obtida e Saída Esperada.
- **Relatório Técnico & Exportação em PDF:**
  - Relatórios ricos abertos em uma nova aba com formatação Markdown.
  - Botão integrado para exportar o relatório com carimbo de data/hora e detalhes técnicos em PDF.

---

## Suíte de Exemplos para Testes (Examples)

A pasta [`CodeJudgeApp/Examples`](file:///C:/Users/evert/OneDrive/Desktop/CodeJudge/CodeJudgeApp/Examples/) disponibiliza exercícios clássicos com código-fonte em 4 linguagens (**C, C++, Java e Python**) e pares de arquivos `.txt` formatados para uso direto no Webview da extensão:

| Diretório | Descrição | Arquivos de Entrada e Saída |
|---|---|---|
| `01_EstruturaSequencial/` | Cálculo de custo ao consumidor de veículo (comissão + impostos) | `inputs.txt`, `outputs.txt` |
| `02_EstruturaCondicional/` | Média ponderada e classificação de desempenho de estudantes | `inputs.txt`, `outputs.txt` |
| `03_EstruturaRepeticao/` | Geração dos $N$ primeiros termos da sequência de Fibonacci | `inputs.txt`, `outputs.txt` |
| `04_Funcoes/` | Modularização com funções e verificação de números primos | `inputs.txt`, `outputs.txt` |
| `05_Vetores/` | Processamento de vetor: soma, média, maior e menor elemento | `inputs.txt`, `outputs.txt` |
| `06_Matrizes/` | Cálculo das diagonais principal e secundária de matriz quadrada | `inputs.txt`, `outputs.txt` |
| `07_Strings/` | Inversão, contagem de tamanho e verificação de palíndromos | `inputs.txt`, `outputs.txt` |
| `08_Recursao/` | Funções recursivas puras para Fatorial e Potenciação | `inputs.txt`, `outputs.txt` |

### Como Testar na Extensão:
1. Abra um dos arquivos de código (ex: `Examples/01_EstruturaSequencial/Main.c` ou `main.py`).
2. Abra o painel lateral do CodeJudge e selecione a ação **Executar**.
3. Em "Configuração de Testes", selecione o arquivo `inputs.txt` no campo de Entrada e `outputs.txt` no campo de Saída.
4. Clique em **Processar** para visualizar os resultados e a taxa de acerto.

---

## Pré-requisitos

- **Python 3.10+** (recomendado Python 3.12).
- **Compilador GCC / G++** disponível no `PATH` do sistema.
- **Java Development Kit (JDK 17+)** com `javac` e `java` no `PATH`.
- **Node.js 18+** e **npm** (para build da extensão).
- **Chave de API do Google Gemini** (ou serviço do **Ollama** ativo localmente).

---

## Como Executar

### 1. Inicializando o Backend (CodeJudgeApp)

```bash
cd CodeJudge/CodeJudgeApp

# Criar e ativar ambiente virtual
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Instalar dependências
pip install fastapi uvicorn pydantic google-genai httpx javalang

# Iniciar o servidor
python Main.py
# ou com uvicorn diretamente:
uvicorn Main:app --host 0.0.0.0 --port 8000 --reload
```
A API estará disponível em `http://localhost:8000` (documentação Swagger interativa em `http://localhost:8000/docs`).

### 2. Inicializando a Extensão no Visual Studio Code

```bash
cd CodeJudge/CodeJudgeExtension

# Instalar dependências
npm install

# Compilar o código TypeScript
npm run compile
```

1. Abra a pasta `CodeJudgeExtension` no VS Code.
2. Pressione **F5** para iniciar uma nova janela no modo **Extension Development Host**.
3. Abra qualquer arquivo de código ou exemplo da pasta `Examples/` e utilize a barra lateral do **CodeJudge**.

### 3. Inicializando a Aplicação Web (CodeJudgeWeb)

```bash
cd CodeJudge/CodeJudgeWeb

# Instalar dependências
npm install

# Modo de desenvolvimento (Express + Vite HMR na porta 5000)
npm run dev

# Ou compilar e iniciar em produção
npm run build
npm start
```
Acesse no navegador: `http://localhost:5000`.
Faça login com suas credenciais do Moodle (CPF e senha institucional) para utilizar o juiz online, consultar o catálogo de prompts e visualizar o perfil acadêmico.

---

## Documentação dos Endpoints da API

Todas as rotas retornam respostas padronizadas em JSON:

### 1. Linguagens Suportadas (`Languages`)
- **`GET /languages`** e **`GET /languages/all`**
  - Retorna todas as linguagens configuradas dinamicamente no `Configuration.json`.
  - **Retorno:** `{"success": true, "languages": [{"key": "c", "name": "C", "sourceExtension": ".c", "targetExtension": ".exe", "needsCompilation": true}, ...]}`
  - *Consumido pela extensão VS Code para reconhecimento e validação automática sem alterações manuais de código.*

### 2. Integridade (`Health`)
- **`GET /health`**
  - Verifica o status de todos os compiladores/executores cadastrados e do motor de IA ativo.
  - **Retorno:** Status global (`healthy` ou `warning`), detalhamento por linguagem e dados da IA.

### 3. Compilação (`Compilation`)
- **`POST /compilation/run`**
  - **Body:** `{"statement": "...", "language": "c|cpp|java|python", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "sourcePath": str, "logs": str, "durationMs": float}`
  - *Se houver erro sintático, o diagnóstico de erro é anexado automaticamente.*

### 4. Execução de Código (`Execution`)
- **`POST /execution/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "...", "tests": [{"input": "...", "expected": "..."}]}`
  - **Retorno:** `{"success": bool, "message": str, "rate": int, "inputs": [...], "outputs": [...], "details": {...}}`
  - *Compila previamente o código e roda os cenários de teste em sandbox.*

### 5. Diagnóstico de Erros (`Diagnostic`)
- **`POST /diagnostic/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "...", "logs": "...", "errorType": "compilation|execution|logic"}`
  - **Retorno:** `{"success": bool, "feedback": str}`
  - *Retorna orientação reflexiva socrática sem código pronto.*

### 6. Análise Técnica de Código (`Analysis`)
- **`POST /analysis/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "feedback": str, "durationMs": float}`
  - *Avalia estilo, modularidade, fluxo de controle e segurança, atribuindo nota de 0 a 10.*

### 7. Otimização de Performance (`Optimization`)
- **`POST /optimization/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "recommendations": str, "durationMs": float}`
  - *Avalia complexidade assintótica Big-O, ciclo de vida de memória e hardware profiling com nota de 0 a 10.*

### 8. Gestão de Prompts (`Prompts`)
- **`GET /prompts/all`**: Lista todos os templates carregados organizados por categoria.
- **`GET /prompts/category/{category}`**: Lista os templates de uma categoria específica.
- **`GET /prompts/single/{category}/{promptName}`**: Retorna o conteúdo e metadados de um template.

---

## Configuração Dinâmica (Configuration.json)

O sistema é 100% extensível sem necessidade de alterar o código-fonte Python:

```json
{
  "ai": {
    "default": "gemini",
    "adapters": {
      "GeminiAdapter": "Infrastructure.Engines.GeminiAdapter.GeminiAdapter",
      "OllamaAdapter": "Infrastructure.Engines.OllamaAdapter.OllamaAdapter"
    },
    "engines": {
      "gemini": {
        "adapter": "GeminiAdapter",
        "args": {
          "apiKey": "SUA_CHAVE_GEMINI_AQUI",
          "model": "gemini-2.5-flash"
        }
      },
      "ollama": {
        "adapter": "OllamaAdapter",
        "args": {
          "endpoint": "http://localhost:11434/v1",
          "model": "llama3:latest",
          "apiKey": "ollama",
          "timeoutSeconds": 10
        }
      }
    }
  },
  "languages": {
    "c": {
      "name": "C",
      "sourceExtension": ".c",
      "targetExtension": ".exe",
      "entryNamingStrategy": "fixed",
      "compiler": {
        "command": "gcc",
        "arguments": ["{source}", "-o", "{target}", "-O2", "-Wall"]
      },
      "executor": {
        "command": "{target}",
        "arguments": []
      }
    },
    "cpp": {
      "name": "C++",
      "sourceExtension": ".cpp",
      "targetExtension": ".exe",
      "entryNamingStrategy": "fixed",
      "compiler": {
        "command": "g++",
        "arguments": ["{source}", "-o", "{target}", "-O2", "-Wall"]
      },
      "executor": {
        "command": "{target}",
        "arguments": []
      }
    },
    "java": {
      "name": "Java",
      "sourceExtension": ".java",
      "targetExtension": ".class",
      "entryNamingStrategy": "className",
      "compiler": {
        "command": "javac",
        "arguments": ["-encoding", "UTF-8", "{source}"]
      },
      "executor": {
        "command": "java",
        "arguments": ["-cp", "{workspace}", "{entryClass}"]
      }
    },
    "python": {
      "name": "Python",
      "sourceExtension": ".py",
      "targetExtension": "",
      "entryNamingStrategy": "fixed",
      "compiler": {
        "command": "",
        "arguments": []
      },
      "executor": {
        "command": "python",
        "arguments": ["{source}"]
      }
    }
  },
  "execution": {
    "timeoutSeconds": 10
  },
  "templates": {
    "directory": "./Infrastructure/Templates"
  }
}
```

---

## Diretrizes de Feedback e Aprendizado

O CodeJudge segue uma filosofia clara de mediação formativa e reflexiva:

- **Não Revelação da Resposta:** Quando o código apresenta erros sintáticos, exceções de execução ou divergências em casos de teste, a IA é terminantemente proibida de fornecer o código pronto ou corrigir a linha diretamente. O objetivo é estimular a autodepuração guiada.
- **Perguntas Socráticas e Teste de Mesa:** A IA aponta o conceito da linguagem violado e sugere perguntas para reflexão e valores para simulação manual.
- **Rigor Técnico com Notas Objetivas:** Nas análises de estilo e otimização, o sistema fornece uma avaliação objetiva de 0 a 10 com rubricas claras para apoiar o aprimoramento profissional do código.

---

## Autor e Licença

Desenvolvido por **Everton**.  
Distribuído sob a Licença MIT.
