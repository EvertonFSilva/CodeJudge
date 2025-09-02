# CodeJudge — README

Plataforma modular para **compilar, executar, analisar e otimizar** trechos de código, com **APIs em FastAPI**, **front-end estático** e um **microserviço de autenticação**. O projeto segue um desenho **MVC/MV\*** claro, com registries para _compilers_, _executors_ e _engines_ de IA (atualmente **Gemini**).

---

## Sumário
1. [Visão geral](#visão-geral)
2. [Arquitetura e pastas](#arquitetura-e-pastas)
3. [Tecnologias](#tecnologias)
4. [Pré‑requisitos](#pré-requisitos)
5. [Instalação](#instalação)
6. [Configuração](#configuração)
7. [Como rodar](#como-rodar)
8. [Endpoints principais](#endpoints-principais)
9. [Exemplos com `curl`](#exemplos-com-curl)
10. [Fluxo de trabalho típico](#fluxo-de-trabalho-típico)
11. [Adicionar novas linguagens](#adicionar-novas-linguagens)
12. [Personalizar Prompts da IA](#personalizar-prompts-da-ia)
13. [Padrões e convenções do projeto](#padrões-e-convenções-do-projeto)
14. [Solução de problemas (FAQ)](#solução-de-problemas-faq)
15. [Scripts e comandos úteis](#scripts-e-comandos-úteis)
16. [Licença](#licença)

---

## Visão geral

O **CodeJudge** expõe serviços para:
- **Compilar** código (C, Java).
- **Executar** o binário/classe gerada com _inputs_ de teste.
- **Analisar** e **otimizar** código com suporte de IA (engine **Gemini** via `google-genai`).
- **Listar/ler** prompts de _templates_ (Analysis/Compilation/Execution/Optimization/Error).

Componentes:
- **CodeJudgeApp** (porta **8000**): API principal de código.
- **CodeJudgeWebSystem** (porta **5000**): microserviço de **autenticação** (login + perfil) e _session store_ em memória.
- **CodeJudgeWebClient** (estático): páginas HTML/JS que consomem as APIs.

---

## Arquitetura e pastas

```
CodeJudge/
├─ CodeJudgeApp/                 # API principal (FastAPI)
│  ├─ Adapters/
│  │  ├─ Compilers/             # CCompiler, JavaCompiler
│  │  ├─ Engines/               # GeminiEngine (google.genai)
│  │  └─ Executors/             # CExecutor, JavaExecutor
│  ├─ Application/
│  │  ├─ Controllers/           # *CodeController (camada de orquestração)
│  │  ├─ Prompts/
│  │  │  ├─ PromptManager.py    # Carrega templates + metadados
│  │  │  └─ Templates/
│  │  │     ├─ Analysis/        # CodeStructure.txt, etc.
│  │  │     ├─ Compilation/
│  │  │     ├─ Execution/
│  │  │     ├─ Optimization/
│  │  │     └─ Error/           # Compilation.txt, Execution.txt
│  │  └─ Services/              # *CodeService (lógica de domínio)
│  ├─ Core/
│  │  ├─ Base/                  # EngineBase, CompilerBase, ExecutorBase
│  │  ├─ Config/
│  │  │  ├─ Configuration.json  # Engines/Compilers/Executors/Prompts
│  │  │  └─ ConfigurationManager.py
│  │  └─ Container/             # 'Injeção' via setters/gets globais
│  ├─ Domain/
│  │  ├─ Entities/Results/      # *CodeResult (Compilation/Execution/...)
│  │  └─ ValueObjects/          # SourceCode, etc.
│  ├─ Presentation/
│  │  ├─ Routers/               # Rotas FastAPI (analysis, compilation,...)
│  │  └─ Schemas/               # Requests/Responses (Pydantic)
│  ├─ Utils/                    # CodeUtils, Registries (Engine/Compiler/Executor)
│  └─ Main.py                   # Inicialização da API (porta 8000)
│
├─ CodeJudgeWebSystem/          # API de autenticação (FastAPI, porta 5000)
│  ├─ Controllers/ Services/ Routers/ Presentation/ Utils/ Main.py
│  └─ Utils/TokenManager.py     # Store de sessões em memória (token → session)
│
└─ CodeJudgeWebClient/          # Front-end estático (HTML/CSS/JS)
   ├─ index.html, login.html, profile.html, prompts.html
   └─ assets/js/                # MVC client-side (controllers/models/views/utils)
```

### Fluxo resumido
1. **WebClient** chama **WebSystem** (`/auth/login`) ⇒ retorna `authToken` e guarda em `SessionManager` (localStorage).
2. **WebClient** chama **CodeJudgeApp** para compilar/executar/analisar/otimizar.
3. **CodeJudgeApp** usa registries para escolher `Compiler`/`Executor` pela língua e `Engine` de IA para prompts.

---

## Tecnologias

- **Python 3.10+**
- **FastAPI** + **Uvicorn**
- **Pydantic**
- **google-genai** (SDK oficial do Gemini)
- **Requests**, **BeautifulSoup4** (no microserviço de auth)
- **GCC** (C) e **JDK** (Java) presentes no `PATH` (para compilar/executar).

---

## Pré-requisitos

- Python **3.10+** (recomendado 3.11).
- **GCC** instalado (Windows: MinGW-w64/LLVM-Mingw; Linux/macOS: via gerenciador).
- **JDK 17+** com `javac` e `java` no `PATH`.
- Chave **Gemini** válida para `google-genai` (substituir no `Configuration.json`).

> **Windows (PowerShell)** — verifique:
```powershell
python --version
gcc --version
javac -version
java -version
```

---

## Instalação

Clone ou extraia o projeto (este repositório contém três módulos irmãos):

```
CodeJudge/
├─ CodeJudgeApp/
├─ CodeJudgeWebSystem/
└─ CodeJudgeWebClient/
```

### 1) Criar ambientes virtuais e instalar dependências

> **CodeJudgeApp** (API principal em :8000)
```bash
cd CodeJudge/CodeJudgeApp
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install fastapi uvicorn pydantic google-genai
```

> **CodeJudgeWebSystem** (API auth em :5000)
```bash
cd ../CodeJudgeWebSystem
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install fastapi uvicorn requests beautifulsoup4 pydantic
```

> **CodeJudgeWebClient** (estático)
- Não há dependências de Node; é HTML/JS puro.
- Recomendado servir com um HTTP simples (evita CORS `origin null`).

```bash
cd ../CodeJudgeWebClient
# Servidor simples na porta 5173 (exemplo)
python -m http.server 5173
# Acesse: http://localhost:5173/login.html
```

> **Dica (Windows):** se preferir, use `python -B` para não gerar `__pycache__`:
```powershell
python -B Main.py
```

---

## Configuração

### 1) Config de Engines/Compilers/Executors/Prompts
Arquivo: `CodeJudgeApp/Core/Config/Configuration.json`

```jsonc
{{
  "ai": {{
    "default": "gemini",
    "engines": {{
      "gemini": {{
        "module": "Adapters.Engines.GeminiEngine",
        "class": "GeminiEngine",
        "args": {{ "apiKey": "<SUA_CHAVE>", "model": "gemini-2.5-flash", "endpoint": "" }}
      }}
    }}
  }},
  "compilers": {{ "languages": {{
    "c":    {{ "module": "Adapters.Compilers.CCompiler",    "class": "CCompiler",    "args": {{ "compilerPath": "gcc"   }} }},
    "java": {{ "module": "Adapters.Compilers.JavaCompiler", "class": "JavaCompiler", "args": {{ "compilerPath": "javac" }} }}
  }} }},
  "executors": {{ "languages": {{
    "c":    {{ "module": "Adapters.Executors.CExecutor",    "class": "CExecutor",    "args": {{}} }},
    "java": {{ "module": "Adapters.Executors.JavaExecutor", "class": "JavaExecutor", "args": {{}} }}
  }} }},
  "prompts": {{
    "paths": {{
      "analysis": "./Application/Prompts/Templates/Analysis",
      "compilation": "./Application/Prompts/Templates/Compilation",
      "optimization": "./Application/Prompts/Templates/Optimization",
      "execution": "./Application/Prompts/Templates/Execution",
      "error": "./Application/Prompts/Templates/Error"
    }}
  }}
}}
```

> **Importante:** Substitua `apiKey` pela sua chave do Gemini. Para maior segurança, considere mover o carregamento da chave para variável de ambiente e ajustar o `ConfigurationManager`.

### 2) CORS
Ambas as APIs vêm configuradas com `allow_origins=["*"]`. Se for publicar, **restrinja** as origens.

### 3) Portas
- CodeJudgeApp: **8000**
- CodeJudgeWebSystem: **5000**
- WebClient: você escolhe (ex.: **5173**). Ajuste URLs do front caso altere as portas (veja `assets/js/models/*.js`).

---

## Como rodar

### Terminal 1 — API principal (8000)
```bash
cd CodeJudge/CodeJudgeApp
# Ativar venv…
uvicorn Main:app --host 0.0.0.0 --port 8000 --reload
# ou simplesmente:
python Main.py
```

### Terminal 2 — API de autenticação (5000)
```bash
cd CodeJudge/CodeJudgeWebSystem
# Ativar venv…
uvicorn Main:app --host 0.0.0.0 --port 5000 --reload
# ou:
python Main.py
```

### Terminal 3 — Front-end (estático)
```bash
cd CodeJudge/CodeJudgeWebClient
python -m http.server 5173
# Acesse http://localhost:5173/login.html
```

---

## Endpoints principais

### CodeJudgeApp (porta 8000)
- `POST /compilation/run` — **Compila** código.
  - **Body**: `{{"language": "c|java", "code": "<string>"}}`
  - **Response**: `{{"success": bool, "message": str, "sourcePath": str, "logs": str}}`

- `POST /execution/run` — **Executa** programa/classe (roda 1x por teste).
  - **Body**: `{{"language": "c|java", "code": "<string>", "tests": ["<stdin-1>", "<stdin-2>", ...]}}`
  - **Response**: `{{"success": bool, "message": str, "inputs": [], "outputs": [], "rate": float, "details": {{}}}}`

- `POST /analysis/run` — **Análise** de código (IA).
  - **Body**: `{{"language": "c|java", "code": "<string>"}}`
  - **Response**: `{{"success": bool, "message": str}}`

- `POST /optimization/run` — **Sugestões de otimização** (IA).
  - **Body**: `{{"language": "c|java", "code": "<string>"}}`
  - **Response**: `{{"success": bool, "message": str}}`

- `GET /prompts/all` — Lista todos os templates + metadados.
- `GET /prompts/category/{{category}}` — Lista nomes por categoria (`analysis|compilation|optimization|execution|error`).
- `GET /prompts/single/{{category}}/{{promptName}}` — Retorna texto + metadados do template.

### CodeJudgeWebSystem (porta 5000)
- `POST /auth/login`
  - **Body**: `{{"username": "<>", "password": "<>"}}`
  - **Response**: `{{"success": bool, "message": str, "authToken": str}}`

- `GET /auth/profile`
  - **Headers**: `X-Auth-Token: <token>`
  - **Response**: `{{"success": bool, "message": str, "profile": {{...}}}}`

---

## Exemplos com `curl`

**Compilar (Java)**
```bash
curl -X POST http://localhost:8000/compilation/run   -H "Content-Type: application/json"   -d @- <<'JSON'
{{"language":"java","code":"public class Main { public static void main(String[] args){ System.out.println(\"Hello\"); } }"}}
JSON
```

**Executar (C) com 2 testes**
```bash
curl -X POST http://localhost:8000/execution/run   -H "Content-Type: application/json"   -d @- <<'JSON'
{{"language":"c","code":"#include <stdio.h>\nint main(){int x; if(scanf(\"%d\",&x)==1) printf(\"%d\\n\", x*2); return 0;}", "tests":["21","7"]}}
JSON
```

**Analisar (IA)**
```bash
curl -X POST http://localhost:8000/analysis/run   -H "Content-Type: application/json"   -d @- <<'JSON'
{{"language":"java","code":"public class Main { }"}}
JSON
```

**Prompts — listar por categoria**
```bash
curl http://localhost:8000/prompts/category/analysis
```

**Login**
```bash
curl -X POST http://localhost:5000/auth/login   -H "Content-Type: application/json"   -d '{{"username":"seu_login","password":"sua_senha"}}'
```

---

## Fluxo de trabalho típico

1. **Login** no `CodeJudgeWebSystem` para obter `authToken` (usado só pelo front).
2. No `CodeJudgeApp`:
   - **Compilar** → checar `logs` e `sourcePath`.
   - **Executar** → envie `tests` (um stdin por execução).
   - **Análise/Otimização** → receba texto da IA com feedback e melhorias.
3. **Prompts** → consulte modelos e seus metadados para customizar o comportamento da IA.

---

## Adicionar novas linguagens

1. Implemente **Compiler** e **Executor** em `Adapters/Compilers` e `Adapters/Executors` estendendo `*Base`.
2. Registre no `Configuration.json` em `compilers.languages` e `executors.languages`:
   ```jsonc
   "python": {{ "module": "Adapters.Compilers.PyCompiler", "class": "PyCompiler", "args": {{}} }}
   ```
3. Se precisar, ajuste `CodeUtils.deriveFileNameFromCode` para gerar nomes de arquivos corretos.
4. Reinicie a API.

---

## Personalizar Prompts da IA

- Pastas em `Application/Prompts/Templates/*` contêm `.txt` com campos como `#name` e `#description` no topo.  
- **Dicas**:
  - Crie variações por categoria (`analysis`, `compilation`, `execution`, `optimization`, `error`).
  - Use nomes curtos (o `PromptManager` normaliza para `lowercase_underscore`).

---

## Padrões e convenções do projeto

- **MVC/MV\*** em todas as camadas (Controllers, Services, Routers, Schemas).
- **CamelCase** para nomes de classes/arquivos principais conforme preferências do projeto.
- **Registros (registries)** para **IA**, **Compiladores**, **Executores** com _Dependency Injection_ simples via `Core.Container`.
- **Pydantic** nas **Requests/Responses** (FastAPI).
- **Separação** de **prompts** por categoria, com **metadados** embutidos.

---

## Solução de problemas (FAQ)

- **`gcc`/`javac` não encontrados**  
  Garanta que as ferramentas estão no `PATH`. Em Windows, instale **MinGW-w64** e **JDK** e reinicie o terminal.

- **CORS / origem `null` no front**  
  Prefira servir o `CodeJudgeWebClient` com `python -m http.server` ao invés de abrir `file:///...` diretamente.

- **Chave do Gemini exposta no repo**  
  Edite `Configuration.json` e substitua pela sua chave. Recomenda-se mover para **variáveis de ambiente** e ajustar o `ConfigurationManager` futuramente.

- **Execução com _inputs_**  
  O executor roda **uma vez por item** em `tests` e envia o texto como **stdin** para o programa.

- **Auto-reload**  
  O `Main.py` já liga `reload` no `uvicorn` em modo script. Também é possível iniciar com `uvicorn Main:app --reload`.

---

## Scripts e comandos úteis

```bash
# Rodar API principal (8000)
uvicorn Main:app --host 0.0.0.0 --port 8000 --reload

# Rodar API auth (5000)
uvicorn Main:app --host 0.0.0.0 --port 5000 --reload

# Rodar Python sem gerar __pycache__
python -B Main.py

# Servir front local
python -m http.server 5173
```

---

## Licença

Este projeto está sob a Licença MIT.
