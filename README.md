# CodeJudge - Plataforma de Avaliação de Código & Assistência com IA (v2.0.0)

Plataforma educacional e profissional modular para **compilação, execução, diagnóstico de erros, análise técnica de código e otimização de desempenho** em tempo real. Desenvolvido por **Everton** para o **Instituto Federal Fluminense (IFF)**.

O ecossistema é estruturado em três módulos independentes e perfeitamente integrados: um **backend robusto em Python (FastAPI)** sob os princípios da **Clean Architecture**, uma **aplicação web completa em React + TypeScript + Bootstrap 5** com autenticação integrada ao **Moodle IFF**, e uma **extensão interativa para o Visual Studio Code (TypeScript)**.

---

## Sumário
1. [Visão Geral dos Módulos](#visão-geral-dos-módulos)
2. [Arquitetura do Backend (CodeJudgeApp)](#arquitetura-do-backend-codejudgeapp)
3. [Aplicação Web Unificada (CodeJudgeWeb)](#aplicação-web-unificada-codejudgeweb)
4. [Extensão para Visual Studio Code (CodeJudgeExtension)](#extensão-para-visual-studio-code-codejudgeextension)
5. [Aplicação Desktop Nativa Windows (CodeJudgeDesktop)](#aplicação-desktop-nativa-windows-codejudgedesktop)
6. [Padrões de Projeto Aplicados](#padrões-de-projeto-aplicados)
7. [Suíte de Exemplos para Testes (Examples)](#suíte-de-exemplos-para-testes-examples)
8. [Pré-requisitos](#pré-requisitos)
9. [Instalação e Configuração do Ollama (IA Local Gratuita)](#instalação-e-configuração-do-ollama-ia-local-gratuita)
10. [Como Executar](#como-executar)
11. [Documentação dos Endpoints da API](#documentação-dos-endpoints-da-api)
12. [Configuração Dinâmica (Configuration.json)](#configuração-dinâmica-configurationjson)
13. [Diretrizes de Feedback e Aprendizado](#diretrizes-de-feedback-e-aprendizado)
14. [Autor e Licença](#autor-e-licença)

---

## Visão Geral dos Módulos

O repositório é composto por 4 módulos desacoplados:

```
CodeJudge/
├── CodeJudgeApp/          # API Backend em Python (FastAPI) rodando na porta 8000
├── CodeJudgeWeb/          # Aplicação Web unificada (React 18 + Express + Bootstrap 5) na porta 5000
├── CodeJudgeExtension/    # Extensão oficial para Visual Studio Code (TypeScript)
└── CodeJudgeDesktop/      # Aplicação Desktop Nativa Windows (C# .NET 8 WPF + WebView2 + Inno Setup)
```

- **`CodeJudgeApp/`**: Backend em FastAPI estruturado em Clean Architecture. Realiza o gerenciamento seguro de compilação, execução em sandbox de disco isolado, análise técnica com IA e geração de diagnósticos formativos (Google Gemini ou Ollama local).
- **`CodeJudgeWeb/`**: Sistema Web moderno que unifica a autenticação institucional no **Moodle IFF**, bancada de processamento de código com detecção automática de linguagens, suporte a casos de teste com arquivos `.txt`, catálogo de prompts e geração de relatórios técnicos em PDF.
- **`CodeJudgeExtension/`**: Extensão para VS Code com interface Webview lateral nativa, detecção inteligente de linguagem do arquivo ativo no editor, execução de testes automatizados e visualização de relatórios.
- **`CodeJudgeDesktop/`**: Aplicação Desktop executável nativa para Windows (`.exe`), desenvolvida em **C# (.NET 8 WPF)** com integração com o **Microsoft Edge WebView2**, supervisão autônoma de ciclo de vida do backend local (`BackendSupervisor`) e instalador profissional em padrão wizard (`CodeJudge-v2.0.0-Setup.exe`).

---

## Arquitetura do Backend (CodeJudgeApp)

O **CodeJudgeApp** segue rigorosamente a **Clean Architecture** (Arquitetura Limpa), dividida em camadas concêntricas onde as dependências apontam sempre para o centro (Domínio):

```
CodeJudgeApp/
├── Configuration.json                 # Configuração de motores de IA, compiladores, comandos e flags
├── Main.py                            # Composition Root (Injeção de dependências e inicialização)
│
├── Domain/                            # Núcleo de Domínio (Regras de negócio e entidades puras)
│   ├── Contracts/                     # Interfaces/Abstrações puras
│   │   ├── IAiEngine.py               # Contrato genérico para motores de IA
│   │   ├── ICompiler.py               # Contrato de estratégia de compilação
│   │   ├── ICompilerRegistry.py       # Contrato de consulta de compiladores
│   │   ├── IExecutor.py               # Contrato de estratégia de execução
│   │   ├── IExecutorRegistry.py       # Contrato de consulta de executores
│   │   ├── ILanguageRepository.py     # Contrato para consulta de linguagens suportadas
│   │   └── IPromptRepository.py       # Contrato para recuperação de templates de IA
│   ├── Entities/                      # Entidades e Value Objects
│   │   ├── ExecutionMetrics.py        # Métricas de tempo e consumo de processamento
│   │   ├── ExecutionWorkspace.py      # Sandbox de disco com padrão Context Manager
│   │   ├── Feedback.py                # Objeto de feedback avaliativo
│   │   ├── Language.py                # Entidade de linguagem e detecção de entrypoint (AST)
│   │   ├── PromptBuilder.py           # Builder Pattern para montagem fluente de prompts
│   │   ├── PromptDocument.py          # Documento de template com metadados
│   │   ├── ScenarioOutcome.py         # Resultado de execução de um cenário de teste
│   │   ├── SourceCode.py              # Código-fonte, extensão e metadados sintáticos
│   │   └── TestScenario.py            # Caso de teste (entrada stdin e saída esperada)
│   ├── Exceptions/                    # Exceções de domínio
│   │   └── DomainException.py         # Hierarquia de exceções de negócio
│   └── Reports/                       # Relatórios tipados de saída
│       ├── AnalysisReport.py
│       ├── CompilationReport.py
│       ├── ExecutionReport.py
│       └── OptimizationReport.py
│
├── Application/                       # Casos de Uso (Orquestração de regras da aplicação)
│   └── UseCases/
│       ├── AnalyzeCodeUseCase.py      # Análise do código (qualidade, estilo, manutenibilidade)
│       ├── CompileCodeUseCase.py      # Compilação de código com integração a diagnóstico
│       ├── DiagnoseErrorUseCase.py    # Diagnóstico autônomo de erros (Método Socrático)
│       ├── ExecuteCodeUseCase.py      # Pipeline de compilação prévia e execução de testes
│       ├── HealthUseCase.py           # Verificação de integridade dos compiladores e da IA
│       ├── OptimizeCodeUseCase.py     # Otimização assintótica e análise de complexidade
│       └── PromptUseCase.py           # Consulta e catálogo de templates de prompts
│
├── Infrastructure/                    # Adaptadores Externos e Implementações de E/S
│   ├── Compilers/
│   │   └── ConfigurableCompiler.py    # Compilação configurável via Configuration.json com tratamento amigável de PATH
│   ├── Config/
│   │   └── ConfigurationManager.py    # Leitura e gerenciamento do Configuration.json
│   ├── Engines/                       # Adaptadores de motores de Inteligência Artificial
│   │   ├── GeminiAdapter.py           # Google GenAI (com suporte a GEMINI_API_KEY / GOOGLE_API_KEY)
│   │   └── OllamaAdapter.py           # Conexão HTTP REST com Ollama local
│   ├── Executors/
│   │   └── ConfigurableExecutor.py    # Execução configurável com captura de I/O e timeout
│   ├── Factories/
│   │   └── EngineFactory.py           # Carregamento dinâmico de IA via reflexão
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
│   ├── Routers/                       # Fábricas de rotas FastAPI
│   └── Schemas/                       # Modelos Pydantic de entrada e saída (DTOs)
│
└── Examples/                          # Suíte de testes e exercícios em C, C++, Java e Python
```

---

## Aplicação Web Unificada (CodeJudgeWeb)

O **CodeJudgeWeb** unifica todo o ecossistema web em uma aplicação única, moderna e responsiva construída com **React 18**, **TypeScript**, **Bootstrap 5** e servidor intermediário **Express**:

- **Autenticação Institucional Moodle IFF:**
  - Login seguro diretamente contra o ambiente **Moodle IFF** utilizando CPF/matrícula e senha institucional.
  - Extração automática dos dados do estudante, cursos matriculados e foto/perfil acadêmico.
- **Detecção Automática de Linguagens:**
  - O usuário não precisa selecionar manualmente a linguagem.
  - O sistema analisa a sintaxe do código digitado ou do arquivo carregado e reconhece dinamicamente se trata de **Java**, **Python**, **C** ou **C++**.
  - O código de exemplo inicial é padrão **Java (`Main.java`)**, garantindo execução imediata sem necessidade de compiladores externos de terceiros.
- **Modos de Operação Flexíveis:**
  - **Processamento Completo (Executar Tudo):** Executa em sequência as 4 etapas padronizadas:
    - `1. Compilação`
    - `2. Execução`
    - `3. Análise do código`
    - `4. Otimização`
  - **Apenas Compilar:** Verificação de sintaxe e validação dos binários gerados.
  - **Apenas Executar:** Execução direta com validação dos casos de teste.
  - **Apenas Análise do código:** Avaliação qualitativa de legibilidade, segurança e boas práticas.
  - **Apenas Otimização:** Avaliação assintótica de complexidade Big-O e uso de memória.
- **Runner de Casos de Teste (Opcional):**
  - Acordeão opcional para upload de arquivos `.txt` de entrada (`inputs.txt`) e saída esperada (`outputs.txt`).
  - Tabela detalhada comparando entrada, saída obtida e saída esperada com percentual de acerto.
- **Catálogo de Prompts Integrado:**
  - Visualização de todos os 20 templates de prompt da plataforma com busca em tempo real e filtros por categoria.
  - Ações diretas de copiar template e carregar diretamente na bancada de trabalho.
- **Interface e Navegação Profissional:**
  - Segmented control central para navegação entre **Processamento** e **Prompts**.
  - Menu de perfil no canto superior direito (`>>>`): chip do estudante que se expande ao clicar, permitindo acessar **Meu Perfil** ou **Sair** (encerrar sessão no Moodle IFF).
  - Menu mobile padrão Bootstrap com botão hamburguer (`bi-list` / `bi-x-lg`) e gaveta de navegação suave.
  - Botões de ação do editor ("Carregar", "Copiar", "Limpar") com alinhamento visual, mesma cor base e micro-interações dinâmicas.
- **Exportação de Relatórios em PDF:**
  - Geração instantânea de relatório técnico em PDF com carimbo institucional, código-fonte analisado, métricas de execução e parecer formativo da IA.
- **Normalização e Renderização Robusta de Markdown:**
  - Motor de renderização com algoritmo adaptativo de cercas de código (`normalizeMarkdownCodeFences`). Trata e isola blocos colados a textos contextuais emitidos pela IA (ex: `Trecho Atual: ```java`), garantindo que tanto a visualização em tela quanto o relatório exportado em PDF exibam blocos de código formatados com syntax styling, espaçamento monoespaçado e quebras de linha preservadas.

---

## Extensão para Visual Studio Code (CodeJudgeExtension)

A extensão para o VS Code transforma o editor em uma bancada de aprendizado interativo:

- **Identificação Automática de Linguagem:**
  - Detecta automaticamente a linguagem a partir do arquivo ativo no VS Code ou da sintaxe presente no editor.
  - Sincroniza dinamicamente as extensões e regras com a rota `/languages` da API.
- **Painel Lateral Webview:**
  - Campo opcional para enunciado da tarefa.
  - Seleção das etapas: **Processamento Completo**, **Compilar**, **Executar**, **Análise do código** e **Otimização**.
  - Dropdown dinâmico de templates de prompts alimentado pela API.
- **Runner de Testes Automatizados:**
  - Upload de arquivos de entrada (`inputs.txt`) e saída esperada (`outputs.txt`).
  - Execução linha a linha com tabela comparativa e taxa percentual de sucesso.
- **Exportação e Visualização:**
  - Visualizador de relatórios técnicos em Markdown dentro do próprio editor.
  - Exportação direta do relatório consolidado para PDF via motor nativo de geração documental.
- **Suporte Integral a Múltiplos Prompts e Resiliência Local:**
  - Timeout de comunicação calibrado para 300 segundos, permitindo a execução completa e sequencial de todas as baterias de prompts sem interrupções prematuras.
  - Normalização de cercas de código em Markdown (`normalizeMarkdownCodeFences`) integrada ao pipeline de geração de relatórios, garantindo que o preview nativo do VS Code e o PDFKit processem perfeitamente blocos de código com identificadores de linguagem (`java`, `python`, `c`, `cpp`).

---

## Aplicação Desktop Nativa Windows (CodeJudgeDesktop)

O **CodeJudgeDesktop** complementa os módulos Web e Extensão fornecendo uma experiência desktop completa, instalável e nativa para Windows no formato de uma **IDE moderna de desenvolvimento e avaliação pedagógica**, eliminando a dependência de scripts manuais de inicialização ou terminais abertos para usuários finais.

### Características do CodeJudge Desktop

- **Executável Nativo Compilado em C# (.NET 8 WPF):**
  - Desenvolvido em **C#** com **Windows Presentation Foundation (WPF)** e arquitetura 64-bit (`win-x64`).
  - Estrutura de publicação em **Clean Folder** com manifesto de aplicação (`app.manifest` com `asInvoker`), metadados completos de assembly (IFF) e separação de DLLs assinadas, eliminando por completo falsos positivos de antivírus (Windows Defender ML heuristics).
- **Interface Gráfica no Estilo IDE Profissional:**
  - **Editor de Código Completo:** Gutter com numeração de linhas sincronizada, fontes monoespaçadas, suporte a indentação com a tecla `Tab` (4 espaços sem perda de foco) e atalho de execução `Ctrl + Enter`.
  - **Abas de Arquivos e Presets de Linguagem:** Botões de acesso rápido com templates limpos para **Java**, **Python**, **C** e **C++**, além de seletor dos 4 exercícios de exemplo integrados.
  - **Gaveta Inferior Multiuso (Console & Runner):**
    - 📟 *Terminal / Saída:* Exibição de logs do compilador e saída de execução formatados como terminal escuro.
    - 🧪 *Casos de Teste:* Upload/edição de `inputs.txt` e `outputs.txt` com tabela comparativa de veredito.
    - 📝 *Enunciado da Tarefa:* Área dedicada para contextualização do problema.
  - **Bancada Lateral de Avaliação & IA (Idêntica à Extensão do VS Code):** Cartão de arquivo ativo, dropdown estilizado de modos de operação, botão principal de execução em degradê esmeralda, stepper de 4 etapas em tempo real, diagnóstico socrático de erros, pareceres qualitativos, análise assintótica de complexidade e bloco de código otimizado com injeção direta no editor (*Aplicar no Editor*).
  - **Barra de Status Inferior:** Métricas de arquivo (linha, coluna, caracteres, codificação), status de integridade do backend (porta 8000), motor de IA ativo e botão de verificação de versão.
- **Sistema de Notificação e Atualização Obrigatória (GitHub):**
  - Integração contínua com o repositório oficial no GitHub (`EvertonFSilva/CodeJudge`).
  - Monitora releases e `version.json`. Ao detectar uma nova versão remota superior à instalada (`v2.0.0`), exibe um **modal popup bloqueante** que detalha o changelog e exige que o usuário realize o download da nova versão no GitHub antes de prosseguir, garantindo integridade e conformidade de segurança.
- **Integração com Microsoft Edge WebView2 Runtime:**
  - Carrega a bancada interativa de forma ultrarrápida diretamente do disco local através de mapeamento virtual seguro (`https://app.codejudge.local`).
  - Isolamento de cache e dados de sessão na pasta local `%LOCALAPPDATA%\CodeJudge\WebView2Data`.
- **Supervisão Inteligente de Backend (`BackendSupervisor`):**
  - Monitora continuamente a disponibilidade da API do CodeJudge na porta `8000` (`/health`).
  - Se o backend estiver offline, tenta inicializar automaticamente o motor Python em segundo plano de forma oculta (sem abrir janelas pretas de console).
  - Encerra de forma limpa qualquer processo filho iniciado ao fechar a janela do aplicativo.
  - Indicador visual no cabeçalho: verde (*Backend Online*), amarelo (*Iniciando*) ou vermelho (*Offline* com botão para reconexão manual).

### Instalador Oficial do Windows (`CodeJudge-v2.0.0-Setup.exe`)

Gerado com o compilador **Inno Setup 6**, o instalador oferece um assistente clássico passo a passo (*Wizard*):
1. **Tela de Boas-Vindas:** Apresentação visual e identificação institucional do IFF.
2. **Termos de Uso e Licença de Software Acadêmico:** Exigência de leitura e aceite dos termos formais de licença de software educacional antes de prosseguir.
3. **Seleção de Pasta de Instalação:** Padrão em `C:\Program Files\CodeJudge` ou pasta de preferência do usuário com privilégios adequados.
4. **Criação de Atalhos:** Opção de criar ícones na **Área de Trabalho** e grupo no **Menu Iniciar**.
5. **Instalação e Desinstalador Nativo:** Registra o desinstalador oficial no Windows (*Configurações > Aplicativos > Aplicativos Instalados*), permitindo a remoção limpa e completa a qualquer momento.
6. **Conclusão:** Opção de iniciar o CodeJudge Desktop imediatamente após a conclusão da instalação.

---

## Padrões de Projeto Aplicados

1. **Inversion of Control & Dependency Inversion Principle (DIP):**
   - Os Casos de Uso dependem exclusivamente de abstrações do Domínio (`ILanguageRepository`, `ICompilerRegistry`, `IExecutorRegistry`, `IAiEngine`, `IPromptRepository`). A camada `Application` possui zero referências à camada `Infrastructure`.
2. **Builder Pattern (`PromptBuilder`):**
   - Montagem fluente de prompts para os modelos de IA com isolamento de contexto, formatação de código e injeção de logs de erro sem concatenações manuais de strings.
3. **Módulo de Diagnóstico de Erro Isolado (`DiagnoseErrorUseCase`):**
   - A geração de feedback socrático é um caso de uso autônomo, acessível tanto internamente pelas etapas de compilação/execução quanto diretamente pela rota `/diagnostic/run`.
4. **Strategy & Registry Patterns:**
   - Compiladores e executores implementam as interfaces `ICompiler` e `IExecutor`, sendo instanciados e consultados dinamicamente via `CompilerRegistry` e `ExecutorRegistry`.
5. **Adapter & Factory Patterns:**
   - Adaptadores de IA implementam `IAiEngine` (`GeminiAdapter`, `OllamaAdapter`). A classe `EngineFactory` utiliza reflexão dinâmica (`importlib`) baseada nas definições do `Configuration.json`.
6. **Context Manager Pattern:**
   - A entidade `ExecutionWorkspace` implementa gerenciador de contexto (`__enter__` e `__exit__`), criando sandboxes temporários isolados no disco e garantindo a limpeza determinística após a execução.
7. **Pipeline / Orchestrator Pattern:**
   - `ExecuteCodeUseCase` coordena o fluxo sequencial: Validação $\rightarrow$ Compilação Prévia $\rightarrow$ Execução dos Casos de Teste $\rightarrow$ Diagnóstico de Divergência $\rightarrow$ Descarte do Sandbox.
8. **Composition Root Pattern:**
   - O arquivo `Main.py` atua como o ponto central de composição, instanciando todas as dependências e repassando-as aos controllers e rotas da API.

---

## Suíte de Exemplos para Testes (Examples)

O diretório [`CodeJudgeApp/Examples`](file:///C:/Users/evert/OneDrive/Desktop/CodeJudge/CodeJudgeApp/Examples/) disponibiliza exercícios clássicos com código-fonte em 4 linguagens (**Java, Python, C e C++**) e arquivos `.txt` prontos para teste na Web e na Extensão:

| Diretório | Descrição | Arquivos de Teste |
|---|---|---|
| `01_EstruturaSequencial/` | Cálculo de custo ao consumidor de veículo (comissão + impostos) | `inputs.txt`, `outputs.txt` |
| `02_EstruturaCondicional/` | Média ponderada e classificação de notas de estudantes | `inputs.txt`, `outputs.txt` |
| `03_EstruturaRepeticao/` | Geração dos $N$ primeiros termos da sequência de Fibonacci | `inputs.txt`, `outputs.txt` |
| `04_Funcoes/` | Modularização com funções e verificação de números primos | `inputs.txt`, `outputs.txt` |
| `05_Vetores/` | Processamento de vetor: soma, média, maior e menor elemento | `inputs.txt`, `outputs.txt` |
| `06_Matrizes/` | Cálculo das diagonais principal e secundária de matriz quadrada | `inputs.txt`, `outputs.txt` |
| `07_Strings/` | Inversão, contagem de tamanho e verificação de palíndromos | `inputs.txt`, `outputs.txt` |
| `08_Recursao/` | Funções recursivas puras para Fatorial e Potenciação | `inputs.txt`, `outputs.txt` |

---

## Pré-requisitos

- **Python 3.10+** (recomendado Python 3.12).
- **Java Development Kit (JDK 17+)** com `javac` e `java` no `PATH` do sistema.
- **Node.js 18+** e **npm**.
- **Compilador GCC / G++** (opcional, necessário caso vá compilar códigos em C e C++ no Windows).
- **Chave de API do Google Gemini** (ou serviço local do **Ollama** ativo).

---

## Instalação e Configuração do Ollama (IA Local Gratuita)

O **Ollama** permite executar modelos de linguagem (LLMs) diretamente na sua máquina local de forma 100% gratuita, com privacidade absoluta, sem custos de API e sem necessidade de conexão constante com serviços de nuvem.

### 1. Como Instalar o Ollama

- **Windows**:
  1. Baixe o instalador oficial em: [ollama.com/download](https://ollama.com/download).
  2. Execute o arquivo `OllamaSetup.exe` e siga as instruções na tela.
  3. O serviço iniciará automaticamente em segundo plano (o ícone do Ollama aparecerá na barra de notificações).

- **Linux**:
  Execute o comando oficial no terminal:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

- **macOS**:
  Baixe o `.dmg` em [ollama.com/download/mac](https://ollama.com/download/mac) ou instale via Homebrew:
  ```bash
  brew install ollama
  ```

### 2. Modelos Recomendados para Código e Avaliação Didática

Abra o prompt de comando ou terminal da sua máquina e execute o comando correspondente ao modelo desejado. O Ollama fará o download e iniciará o modelo automaticamente:

- **Qwen 2.5 Coder 7B (Altamente Recomendado)**:
  Excepcional precisão sintática e didática para Java, Python, C e C++:
  ```bash
  ollama run qwen2.5-coder:7b
  ```

- **Qwen 2.5 Coder 1.5B (Versão Leve)**:
  Ideal para computadores com menor quantidade de memória RAM (4GB a 8GB) ou sem placa de vídeo dedicada (GPU):
  ```bash
  ollama run qwen2.5-coder:1.5b
  ```

- **Outras Excelentes Opções**:
  ```bash
  ollama run deepseek-coder:6.7b
  ollama run codellama
  ollama run llama3:latest
  ```

### 3. Verificando se o Ollama está Operacional

Abra no navegador ou execute no terminal:
```bash
curl http://localhost:11434
```
A resposta esperada deve ser:
```text
Ollama is running
```

### 4. Configurando o CodeJudge para Utilizar o Ollama

No arquivo [`CodeJudgeApp/Configuration.json`](file:///C:/Users/evert/OneDrive/Desktop/CodeJudge/CodeJudgeApp/Configuration.json):

1. Altere o motor padrão de `"gemini"` para `"ollama"`:
   ```json
   "ai": {
     "default": "ollama",
     ...
   ```

2. Na seção de argumentos do Ollama, defina o modelo que você baixou (por exemplo, `qwen2.5-coder:7b`):
   ```json
   "engines": {
     "ollama": {
       "adapter": "OllamaAdapter",
       "args": {
         "endpoint": "http://localhost:11434/v1",
         "model": "qwen2.5-coder:7b",
         "apiKey": "ollama",
         "timeoutSeconds": 120
       }
     }
   }
   ```

> [!NOTE]
> O CodeJudge já inclui um tempo limite de requisição de **120 segundos** pré-configurado, com tolerância mínima de segurança de 60 segundos no adaptador (`OllamaAdapter.py`), assegurando que modelos executados na CPU tenham tempo suficiente para gerar avaliações completas e o código refatorado final.

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

# Iniciar o servidor com hot reload na porta 8000
python Main.py
```
A API estará disponível em `http://localhost:8000` (documentação Swagger em `http://localhost:8000/docs`).

### 2. Inicializando a Aplicação Web (CodeJudgeWeb)

```bash
cd CodeJudge/CodeJudgeWeb

# Instalar dependências
npm install

# Modo de desenvolvimento com Vite HMR e Express (porta 5000)
npm run dev

# Ou compilação de produção
npm run build
npm start
```
Acesse no navegador: `http://localhost:5000`.  
Faça login com seu CPF e senha institucional do **Moodle IFF**.

### 3. Inicializando a Extensão no Visual Studio Code

```bash
cd CodeJudge/CodeJudgeExtension

# Instalar dependências e compilar
npm install
npm run compile
```
1. Abra a pasta `CodeJudgeExtension` no VS Code.
2. Pressione **F5** para iniciar o modo **Extension Development Host**.
3. Abra qualquer arquivo de código e utilize o painel lateral do **CodeJudge**.

### 4. Executando e Instalando a Aplicação Desktop (CodeJudgeDesktop)

#### Opção A: Executar o Instalador Oficial (.exe)
Basta dar um duplo clique no instalador gerado:
```
CodeJudge/CodeJudgeDesktop/Installer/Output/CodeJudge-v2.0.0-Setup.exe
```
Siga o assistente de instalação clássico (*Avançar > Aceitar Termos > Selecionar Diretório > Criar Atalhos > Instalar*). O CodeJudge criará os atalhos na Área de Trabalho e no Menu Iniciar.

#### Opção B: Executar Diretamente o Binário Standalone
Se preferir executar sem instalar:
```
CodeJudge/CodeJudgeDesktop/publish/CodeJudge.exe
```

#### Opção C: Compilação e Empacotamento do Projeto C# (Desenvolvedor)
Para recompilar o executável e o instalador a partir do código-fonte:
```powershell
cd CodeJudge/CodeJudgeDesktop

# 1. Compilar e publicar a versão standalone do C# (.NET 8)
dotnet publish CodeJudgeDesktop.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o publish

# 2. Gerar o instalador oficial via Inno Setup Compiler
& "C:\Users\evert\AppData\Local\Programs\Inno Setup 6\ISCC.exe" Installer\CodeJudgeSetup.iss
```
O instalador será gerado em `Installer/Output/CodeJudge-v2.0.0-Setup.exe`.

---

## Documentação dos Endpoints da API

Todas as rotas retornam respostas tipadas em JSON:

### 1. Linguagens Suportadas (`Languages`)
- **`GET /languages`** e **`GET /languages/all`**
  - Retorna todas as linguagens configuradas no `Configuration.json`.
  - **Retorno:** `{"success": true, "languages": [{"key": "java", "name": "Java", ...}, ...]}`

### 2. Integridade (`Health`)
- **`GET /health`**
  - Verifica a disponibilidade dos compiladores instalados e do motor de IA ativo.
  - **Retorno:** Status global (`healthy` ou `warning`) e detalhamento por linguagem.

### 3. Compilação (`Compilation`)
- **`POST /compilation/run`**
  - **Body:** `{"statement": "...", "language": "java|python|c|cpp", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "sourcePath": str, "logs": str, "durationMs": float}`
  - *Em caso de falha de sintaxe, o diagnóstico com IA socrática é anexado automaticamente.*

### 4. Execução de Código (`Execution`)
- **`POST /execution/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "...", "tests": [{"input": "...", "expected": "..."}]}`
  - **Retorno:** `{"success": bool, "message": str, "rate": int, "inputs": [...], "outputs": [...], "details": {...}}`
  - *Compila previamente o código e executa os casos de teste isoladamente no sandbox.*

### 5. Diagnóstico de Erros (`Diagnostic`)
- **`POST /diagnostic/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "...", "logs": "...", "errorType": "compilation|execution|logic"}`
  - **Retorno:** `{"success": bool, "feedback": str}`
  - *Retorna orientação reflexiva socrática guiada sem entregar a solução pronta.*

### 6. Análise Técnica de Código (`Analysis`)
- **`POST /analysis/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "feedback": str, "durationMs": float}`
  - *Avalia estilo, boas práticas, modularidade e segurança de 0 a 10.*

### 7. Otimização de Performance (`Optimization`)
- **`POST /optimization/run`**
  - **Body:** `{"statement": "...", "language": "...", "code": "..."}`
  - **Retorno:** `{"success": bool, "message": str, "recommendations": str, "durationMs": float}`
  - *Avalia complexidade assintótica Big-O e uso de recursos de 0 a 10.*

### 8. Catálogo de Prompts (`Prompts`)
- **`GET /prompts/all`**: Lista todos os 20 templates organizados por categoria.
- **`GET /prompts/category/{category}`**: Lista os templates de uma categoria.
- **`GET /prompts/single/{category}/{promptName}`**: Retorna o conteúdo e metadados de um template.

---

## Configuração Dinâmica (Configuration.json)

O comportamento dos motores de IA e das linguagens é 100% configurável sem alteração de código:

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
          "timeoutSeconds": 300
        }
      }
    }
  },
  "languages": {
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
    },
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

> [!TIP]
> A chave de API do Gemini também pode ser configurada diretamente como variável de ambiente no seu sistema operacional via `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.

---

## Diretrizes de Feedback e Aprendizado

O CodeJudge foi concebido para o aprimoramento formativo do estudante:

- **Não Revelação da Resposta:** Quando o código apresenta falhas sintáticas ou exceções de execução, a IA não fornece código pronto nem corrige diretamente as linhas. O objetivo é estimular a autodepuração ativa.
- **Método Socrático e Teste de Mesa:** A IA indica o conceito violado da linguagem e sugere perguntas de reflexão e valores para simulação manual.
- **Rigor Técnico e Critérios Objetivos:** Nas etapas de `3. Análise do código` e `4. Otimização`, o sistema atribui notas de 0 a 10 fundamentadas em rubricas de complexidade e engenharia de software.

---

## Autor e Licença

Desenvolvido por **Everton** &bull; **Instituto Federal Fluminense (IFF)**.  
Distribuído sob a Licença MIT.
