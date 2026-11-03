# CodeJudge - Plataforma de Avaliação de Código & Assistência com IA (v2.0.0)

Plataforma educacional e profissional modular para **compilação, execução, diagnóstico formativo de erros, análise técnica de código e otimização de desempenho** em tempo real. Desenvolvido por **Everton** para o **Instituto Federal Fluminense (IFF)**.

O ecossistema é estruturado em quatro módulos independentes e integrados sob os princípios da **Clean Architecture**:
1. **`CodeJudgeApp`**: Servidor backend em **Python (FastAPI)** com execução em sandbox isolado, suporte multi-motor de IA (**Google Gemini** e **Ollama Local**), templates objetivos de avaliação universitária (notas de 0 a 10 com explicações diretas e sem sermões conversacionais) e política flexível de chave de API (`isUserKeyRequired`).
2. **`CodeJudgeWeb`**: Aplicação Web em **React 18 + TypeScript + Bootstrap 5** com autenticação institucional integrada ao **Moodle IFF**, seletor de modelos com barra de pesquisa e modal Web de configuração de IA e API Key.
3. **`CodeJudgeExtension`**: Extensão oficial para **Visual Studio Code (TypeScript)** com login via Moodle IFF, sincronização automática de modelos do servidor com busca integrada, gaveta discreta para API Key e geração de relatórios em PDF/Markdown com cabeçalho institucional e tipografia refinada.
4. **`CodeJudgeDesktop`**: Ambiente Desktop nativo para Windows (**C# .NET 8 WPF + WebView2**) no estilo **IDE**, com suporte a múltiplos arquivos em abas, compilação nativa ReadyToRun + proteção de payload AES-256 e seletor de modelo/chave na barra de status da IDE.

---

## Sumário
1. [Visão Geral dos Módulos](#visão-geral-dos-módulos)
2. [Arquitetura do Backend (CodeJudgeApp)](#arquitetura-do-backend-codejudgeapp)
3. [Aplicação Web Unificada (CodeJudgeWeb)](#aplicação-web-unificada-codejudgeweb)
4. [Extensão para Visual Studio Code (CodeJudgeExtension)](#extensão-para-visual-studio-code-codejudgeextension)
5. [Aplicação Desktop Nativa Windows (CodeJudgeDesktop)](#aplicação-desktop-nativa-windows-codejudgedesktop)
6. [Gerenciamento de Chave de API e Modelos de IA Suportados](#gerenciamento-de-chave-de-api-e-modelos-de-ia-suportados)
7. [Padrões de Projeto Aplicados](#padrões-de-projeto-aplicados)
8. [Suíte de Exemplos para Testes (Examples)](#suíte-de-exemplos-para-testes-examples)
9. [Pré-requisitos](#pré-requisitos)
10. [Instalação e Configuração do Ollama (IA Local Gratuita)](#instalação-e-configuração-do-ollama-ia-local-gratuita)
11. [Como Executar](#como-executar)
12. [Documentação dos Endpoints da API](#documentação-dos-endpoints-da-api)
13. [Configuração Dinâmica (Configuration.json)](#configuração-dinâmica-configurationjson)
14. [Diretrizes de Feedback e Aprendizado](#diretrizes-de-feedback-e-aprendizado)
15. [Autor e Licença](#autor-e-licença)

---

## Visão Geral dos Módulos

```
CodeJudge/
├── CodeJudgeApp/          # API Backend em Python (FastAPI) rodando na porta 8000
├── CodeJudgeWeb/          # Aplicação Web (React 18 + Express + Bootstrap 5) na porta 5000
├── CodeJudgeExtension/    # Extensão oficial para Visual Studio Code (TypeScript)
└── CodeJudgeDesktop/      # Aplicação Desktop Nativa Windows (C# .NET 8 WPF + WebView2 + Inno Setup)
```

---

## Arquitetura do Backend (CodeJudgeApp)

O **CodeJudgeApp** segue rigorosamente a **Clean Architecture**, com separação estrita entre Domínio, Aplicação, Infraestrutura e Apresentação:

```
CodeJudgeApp/
├── Configuration.json                 # Configuração de motores de IA, modelos suportados, política de API Key e compiladores
├── Main.py                            # Composition Root (Injeção de dependências e inicialização FastAPI)
│
├── Domain/                            # Núcleo de Domínio (Regras de negócio e entidades puras)
│   ├── Contracts/                     # Interfaces (IAiEngine, ICompiler, IExecutor, ILanguageRepository, IPromptRepository)
│   ├── Entities/                      # SourceCode, Language, ExecutionWorkspace, PromptBuilder, TestScenario, ScenarioOutcome
│   ├── Exceptions/                    # Hierarquia de exceções de domínio (DomainException)
│   └── Reports/                       # Relatórios tipados (CompilationReport, ExecutionReport, AnalysisReport, OptimizationReport)
│
├── Application/                       # Casos de Uso (Orquestração da aplicação)
│   └── UseCases/
│       ├── BaseTemplateUseCase.py     # Classe base (Template Method) para casos de uso baseados em prompts de IA
│       ├── AnalyzeCodeUseCase.py      # Análise técnica de código (herda de BaseTemplateUseCase)
│       ├── OptimizeCodeUseCase.py     # Otimização assintótica e de recursos (herda de BaseTemplateUseCase)
│       ├── DiagnoseErrorUseCase.py    # Diagnóstico formativo de erros de compilação, execução e lógica
│       ├── CompileCodeUseCase.py      # Compilação com acionamento automático do diagnóstico formativo em falhas
│       ├── ExecuteCodeUseCase.py      # Pipeline de compilação prévia, execução em sandbox e diagnóstico de falhas
│       ├── GetAiModelsUseCase.py      # Consulta de motores, modelos suportados e política de chave (isUserKeyRequired)
│       ├── HealthUseCase.py           # Verificação de integridade dos compiladores e motores de IA
│       └── PromptUseCase.py           # Catálogo e consulta de templates de prompts
│
├── Infrastructure/                    # Adaptadores Externos e Implementações de E/S
│   ├── Compilers/                     # ConfigurableCompiler
│   ├── Config/                        # ConfigurationManager
│   ├── Engines/                       # GeminiAdapter e OllamaAdapter
│   ├── Executors/                     # ConfigurableExecutor
│   ├── Factories/                     # EngineFactory (resolução dinâmica e validação de apiKey/model por requisição)
│   ├── Logging/                       # Logger estruturado thread-safe
│   ├── Registries/                    # CompilerRegistry e ExecutorRegistry
│   ├── Repositories/                  # FilePromptRepository
│   └── Templates/                     # 21 templates em Markdown objetivos com formato universitário (Analysis, Compilation, Error, Execution, Optimization)
│
├── Presentation/                      # Camada HTTP / FastAPI
│   ├── Controllers/                   # AiController, AnalysisController, CompilationController, DiagnosticController, etc.
│   ├── Routers/                       # AiRouter, AnalysisRouter, CompilationRouter, DiagnosticRouter, ExecutionRouter, etc.
│   └── Schemas/                       # BaseCodeRequest, AiModelsResponse, CompilationRequest, ExecutionRequest, etc.
│
└── Examples/                          # Suíte de exercícios em C, C++, Java e Python
```

---

## Aplicação Web Unificada (CodeJudgeWeb)

Construída com **React 18**, **TypeScript**, **Bootstrap 5** e **Express**:
- **Autenticação Institucional Moodle IFF** com extração do perfil acadêmico do estudante.
- **Configuração Web de IA & API Key:** Badge indicativa no topo da bancada (`IA do Servidor`, `IA Personalizada` ou `API Key Obrigatória`) e modal Web dedicado para selecionar provedor, modelo suportado (sincronizado via `GET /ai/models`) e salvar a `API Key` localmente no navegador.
- **Detecção Automática de Linguagens** (**Java, Python, C e C++**) pelo código ou extensão do arquivo.
- **5 Modos de Operação:** Processamento Completo, Apenas Compilar, Apenas Executar, Apenas Análise do Código e Apenas Otimização.
- **Diagnóstico Formativo Integrado:** Exibe automaticamente a orientação formativa da IA quando ocorrem erros de compilação ou de execução, além de comparar lado a lado o código original com o código otimizado recomendado.
- **Exportação de Relatórios em Markdown (`.md`) e PDF (`.pdf`)**.

---

## Extensão para Visual Studio Code (CodeJudgeExtension)

Estruturada em **Clean Architecture** (`core/`, `features/`, `infrastructure/`, `presentation/`):
- **Autenticação Institucional Moodle IFF Integrada:** Login direto pelo painel lateral com extração automática do perfil acadêmico do estudante (Nome, Curso/Disciplina, Campus e E-mail institucional), injetados de forma limpa como cabeçalho em relatórios `.md` e `.pdf`.
- **Seletor de Modelos com Barra de Pesquisa:** Dropdown com campo de busca interativo e digitação em tempo real para filtrar instantaneamente modelos de IA disponíveis no servidor.
- **Gaveta Retrátil Discreta de Configuração de IA:** Acesso por ícone compacto de engrenagem/chave no topo da barra lateral para definição de chave de API (`apiKey`) e modelo personalizado sem poluir a área de trabalho.
- **Gerador de Relatórios em PDF de Alta Precisão (PDFKit):** Tipografia aprimorada com espaçamento entrelinhas real 1.5, quebra segura de blocos de código sem sobreposição de cabeçalhos e eliminação definitiva de páginas em branco desnecessárias.
- **Arquitetura Otimizada e Sem Redundâncias:**
  - `BaseHttpGateway`: Centraliza chamadas HTTP, controle de timeout via `AbortController`, cabeçalho `X-Api-Key` e normalização de codificação UTF-8 (`fixEncoding`).
  - `BaseStageUseCase` & `StageContract`: Padronizam telemetria de tempo, logs estruturados e repasse de parâmetros de IA (`apiKey`, `engine`, `model`) entre `CompileUseCase`, `AnalyzeUseCase` e `OptimizeUseCase`.
  - `SyncLanguagesUseCase`: Deduplicação de requisições concorrentes e cache TTL para evitar chamadas repetidas ao endpoint `/languages`.

---

## Aplicação Desktop Nativa Windows (CodeJudgeDesktop)

Desenvolvida em **C# (.NET 8 WPF)** com **Microsoft Edge WebView2**, estruturada em **Clean Architecture** (`Domain/`, `Application/`, `Infrastructure/`, `Presentation/`):
- **Interface Estilo IDE:**
  - Suporte a **múltiplos arquivos abertos simultaneamente em abas**, criação de novos arquivos (`+`) e renomeação direta na aba (`.java`, `.py`, `.c`, `.cpp`) com ajuste automático da linguagem.
  - Enunciado da questão posicionado antes do seletor de Modo de Operação na barra lateral.
  - Aba dinâmica de saída (`Saída — <arquivo>`) aberta automaticamente ao processar o código, com alternância entre Resultado Detalhado, Relatório (`.md`) e Comparação Lado a Lado (`Diff`).
  - **Seletor de Modelo de IA & API Key no Estilo IDE:** Integrado diretamente à barra de status inferior da IDE e à barra de topo, abrindo um painel estilo *Command Palette* (`Preferências da IDE — Motor de IA & API Key`) sincronizado com `/ai/models`.
  - Controles de janela 100% nativos do Windows (minimizar, maximizar/tela cheia, fechar e redimensionamento por bordas).
- **Segurança e Proteção contra Engenharia Reversa:**
  - Compilação nativa **ReadyToRun (R2R)** combinada com empacotamento de recursos web criptografados com **AES-256-CBC** (`AssetVault` / `EncryptedWebResourceInterceptor`), decifrados exclusivamente em memória RAM pelo WebView2.

---

## Gerenciamento de Chave de API e Modelos de IA Suportados

O servidor permite dois modos de operação controlados pela flag `"isUserKeyRequired"` em `CodeJudgeApp/Configuration.json`:

1. **`"isUserKeyRequired": false` (Padrão — Chave Opcional):**
   - Os usuários podem utilizar a IA padrão configurada no servidor sem precisar informar nenhuma chave, **ou** podem opcionalmente enviar sua própria `apiKey` e escolher qualquer modelo suportado pelo servidor.
2. **`"isUserKeyRequired": true` (Chave Obrigatória do Usuário):**
   - O servidor ignora a chave interna e exige que toda solicitação de IA envie uma `apiKey` válida (via corpo JSON `"apiKey"`, query string `?apiKey=...` ou header HTTP `X-Api-Key`).

### Modelos Suportados no Servidor (`/ai/models`)
- **Google Gemini (`gemini`):**
  - Modelos recomendados e ativos: `gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-4-argon`.
  - Fallback automático e tolerância a descontinuações integrado no `GeminiAdapter`.
- **Ollama Local (`ollama`):**
  - `llama3:latest`, `llama3.1:latest`, `llama3.2:latest`, `llama3.3:latest`, `qwen2.5-coder:latest`, `qwen3-coder:latest`, `deepseek-coder:latest`, `deepseek-r1:latest`, `codellama:latest`, `gemma3:latest`, `mistral:latest`, `phi4:latest`.

---

## Padrões de Projeto Aplicados

1. **Clean Architecture & Dependency Inversion Principle (DIP)** em todos os módulos (`CodeJudgeApp`, `CodeJudgeExtension`, `CodeJudgeDesktop`).
2. **Template Method Pattern (`BaseTemplateUseCase` no Backend e `BaseStageUseCase` na Extensão)** para eliminar duplicação de código entre etapas de processamento e avaliação por IA.
3. **Gateway & Adapter Pattern (`BaseHttpGateway`, `GeminiAdapter`, `OllamaAdapter`)** para desacoplar comunicação externa e provedores de IA.
4. **Factory Pattern (`EngineFactory`)** com resolução dinâmica de motores e validação de modelos suportados e chaves de API por requisição.
5. **Builder Pattern (`PromptBuilder`)** e **Context Manager Pattern (`ExecutionWorkspace`)** para isolamento seguro de prompts e sandboxes temporários em disco.

---

## Suíte de Exemplos para Testes (Examples)

O diretório [`CodeJudgeApp/Examples`](file:///C:/Users/evert/OneDrive/Desktop/CodeJudge/CodeJudgeApp/Examples/) disponibiliza exercícios clássicos com código-fonte em 4 linguagens (**Java, Python, C e C++**) e arquivos `.txt` prontos para teste:

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
- **Java Development Kit (JDK 17+)** com `javac` e `java` no `PATH`.
- **Node.js 18+** e **npm**.
- **Compilador GCC / G++** (opcional, para compilação C/C++).
- **Chave de API do Google Gemini** ou serviço local do **Ollama**.

---

## Instalação e Configuração do Ollama (IA Local Gratuita)

1. Baixe e instale o Ollama em [ollama.com/download](https://ollama.com/download).
2. Baixe um modelo recomendado no terminal:
   ```bash
   ollama run qwen2.5-coder:7b
   # ou versão leve:
   ollama run llama3:latest
   ```
3. Verifique se está ativo em `http://localhost:11434`.

---

## Como Executar

### 1. Backend (`CodeJudgeApp`)
```bash
cd CodeJudgeApp
pip install fastapi uvicorn pydantic google-genai httpx javalang
python Main.py
```
Disponível em `http://localhost:8000` (Swagger em `http://localhost:8000/docs`).

### 2. Aplicação Web (`CodeJudgeWeb`)
```bash
cd CodeJudgeWeb
npm install
npm run dev
```
Disponível em `http://localhost:5000`.

### 3. Extensão VS Code (`CodeJudgeExtension`)
```bash
cd CodeJudgeExtension
npm install
npm run compile
```
Abra `CodeJudgeExtension` no VS Code e pressione **F5**.

### 4. Aplicação Desktop (`CodeJudgeDesktop`)
Execute o instalador oficial em `CodeJudgeDesktop/Installer/Output/CodeJudge-v2.0.0-Setup.exe` ou o executável em `CodeJudgeDesktop/publish/CodeJudge.exe`.

---

## Documentação dos Endpoints da API

- **`GET /ai`**, **`GET /ai/models`**, **`GET /ai/supported`**, **`GET /ai/all`**, **`GET /ai/models/{engineKey}`**:
  - Retorna a política `isUserKeyRequired`, `allowUserKeyOverride`, motor/modelo padrão e a lista completa de provedores e modelos de IA suportados pelo servidor.
- **`GET /languages`** e **`GET /languages/all`**:
  - Retorna todas as linguagens configuradas no servidor.
- **`GET /health`**:
  - Verifica a disponibilidade dos compiladores instalados e do motor de IA ativo.
- **`POST /compilation/run`**, **`POST /execution/run`**, **`POST /analysis/run`**, **`POST /optimization/run`**, **`POST /diagnostic/run`**:
  - Aceitam opcionalmente (ou obrigatoriamente quando `isUserKeyRequired: true`) os parâmetros `"apiKey"`, `"engine"` e `"model"` via JSON body, query params (`?apiKey=...&engine=...&model=...`) ou cabeçalho `X-Api-Key`.

---

## Configuração Dinâmica (Configuration.json)

```json
{
  "ai": {
    "default": "ollama",
    "isUserKeyRequired": false,
    "adapters": {
      "GeminiAdapter": "Infrastructure.Engines.GeminiAdapter.GeminiAdapter",
      "OllamaAdapter": "Infrastructure.Engines.OllamaAdapter.OllamaAdapter"
    },
    "engines": {
      "gemini": {
        "name": "Google Gemini",
        "adapter": "GeminiAdapter",
        "requiresApiKey": true,
        "supportedModels": [
          "gemini-3.5-flash-lite",
          "gemini-3.8-flash",
          "gemini-4-argon"
        ],
        "args": {
          "apiKey": "SUA_CHAVE_GEMINI_AQUI",
          "model": "gemini-3.5-flash-lite"
        }
      },
      "ollama": {
        "name": "Ollama (Local)",
        "adapter": "OllamaAdapter",
        "requiresApiKey": false,
        "supportedModels": [
          "llama3:latest",
          "llama3.1:latest",
          "llama3.2:latest",
          "llama3.3:latest",
          "qwen2.5-coder:latest",
          "qwen3-coder:latest",
          "deepseek-coder:latest",
          "deepseek-r1:latest",
          "codellama:latest",
          "gemma3:latest",
          "mistral:latest",
          "phi4:latest"
        ],
        "args": {
          "endpoint": "http://localhost:11434/v1",
          "model": "llama3:latest",
          "apiKey": "ollama",
          "timeoutSeconds": 300
        }
      }
    }
  }
}
```

---

## Diretrizes de Feedback e Aprendizado

- **Formato Objetivo do Avaliador Universitário:** Nas etapas de Análise e Otimização, todos os prompts seguem a estrutura pré-definida de avaliação (`## Título`, `**Código**:`, `**Nota**: [0 a 10]`, `**Explicação**: [justificativa técnica concisa]`).
- **Comunicação Direta sem Prolixidade:** Os retornos da IA são rigorosamente filtrados pela `DIRETRIZ DE OBJETIVIDADE` no `PromptBuilder`, impedindo saudações ("Olá estudante"), introduções conversacionais ou palestras teóricas prolixas sobre sistemas operacionais.
- **Diagnóstico Formativo Socrático:** Em falhas de compilação ou execução, o módulo de diagnóstico orienta a investigação do estudante de forma clara e educativa, sem entregar o código pronto.

---

## Autor e Licença

Desenvolvido por **Everton** &bull; **Instituto Federal Fluminense (IFF)**.  
Distribuído sob a Licença MIT.
