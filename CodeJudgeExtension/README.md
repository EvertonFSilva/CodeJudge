# CodeJudge - Extensão para o Visual Studio Code

Extensão interativa para o Visual Studio Code desenvolvida por **Everton** para aceleração e apoio ao aprendizado de programação com suporte a múltiplas linguagens (**C, C++, Java, Python** e quaisquer novas linguagens configuradas no backend).

A extensão identifica automaticamente a linguagem do arquivo aberto no editor, sincroniza as linguagens suportadas em tempo real com o backend, executa baterias de testes com arquivos `.txt`, apresenta diagnósticos formativos guiados por IA e gera relatórios técnicos com exportação para PDF.

---

## Recursos Principais

- **Identificação Automática de Linguagem:**
  - O usuário **não precisa selecionar a linguagem manualmente**. O próprio código da extensão detecta a linguagem diretamente pelo arquivo ativo no editor (via extensão e `languageId`).
  - O card de arquivo ativo exibe instantaneamente a badge com a linguagem reconhecida (ex: `C`, `C++`, `JAVA`, `PYTHON`) e valida se a linguagem é suportada pelo backend.
- **Sincronização Dinâmica com a Aplicação (`/languages`):**
  - A extensão consome o endpoint `GET /languages` do backend **CodeJudgeApp**.
  - Sempre que uma nova linguagem for adicionada ou alterada no `Configuration.json` do backend, a extensão a reconhece automaticamente na inicialização ou ao reconectar, **sem necessidade de alterar ou recompilar a extensão**.
- **Runner de Testes Automatizados:**
  - Suporte ao carregamento de arquivos de entrada (`inputs.txt`) e gabarito de saída esperada (`outputs.txt`).
  - Execução linha por linha em sandbox isolado com cálculo de taxa de acerto (ex: `100% - Passou`).
  - Comparativo visual detalhado entre entrada, saída esperada e saída obtida.
- **Relatório Técnico & Exportação em PDF:**
  - Abertura automática de relatórios em Markdown em nova aba do editor.
  - Botão integrado de comando para exportar o relatório técnico formatado em PDF via PDFKit nativo.
- **Diagnóstico Formativo com IA:**
  - Filosofia socrática: nunca entrega o código corrigido nem a resposta pronta, estimulando a autodepuração guiada e o aprendizado reflexivo.

---

## Arquitetura da Extensão

A extensão é estruturada rigorosamente seguindo princípios de **Clean Architecture**:

```
CodeJudgeExtension/
├── configuration.json                 # Configuração de conectividade com a API (linguagens obtidas 100% via API)
├── package.json                       # Metadados, comandos e contribuições do VS Code
├── tsconfig.json                      # Configuração estrita do TypeScript
│
├── src/
│   ├── extension.ts                   # Entrypoint e composition root da extensão
│   │
│   ├── core/                          # Entidades, contratos fundamentais e utilitários
│   │   ├── config/                    # ConfigLoader e AppConfig
│   │   ├── entities/                  # Report, TestCase, StageExecutionResult
│   │   ├── errors/                    # AppError, NoActiveEditorError, UnsupportedLanguageError
│   │   ├── languages/                 # LanguageRegistry e LanguageDefinition
│   │   ├── logger/                    # ILogger e VsCodeOutputLogger
│   │   └── utils/                     # EncodingUtils
│   │
│   ├── features/                      # Casos de uso e gateways de cada funcionalidade
│   │   ├── analyze/                   # AnalyzeUseCase e HttpAnalyzeGateway
│   │   ├── compile/                   # CompileUseCase e HttpCompileGateway
│   │   ├── execute/                   # ExecuteUseCase e HttpExecuteGateway
│   │   ├── health/                    # CheckHealthUseCase
│   │   ├── languages/                 # SyncLanguagesUseCase e HttpLanguageGateway
│   │   ├── optimize/                  # OptimizeUseCase e HttpOptimizeGateway
│   │   ├── pdf/                       # PdfExportUseCase e PdfKitReportGenerator
│   │   ├── process/                   # ProcessUseCase (orquestrador das etapas)
│   │   └── prompts/                   # LoadPromptsUseCase e ViewPromptUseCase
│   │
│   ├── infrastructure/                # Adaptadores de integração com VS Code e SO
│   │   ├── storage/                   # FileStorageService (gravação de relatórios temporários)
│   │   └── vscode/                    # VsCodeEditorAdapter (leitura de abas, editores e diálogos)
│   │
│   └── presentation/                  # Controladores e camada de interface Webview
│       ├── controllers/               # ProcessController, PromptController, HealthController
│       ├── messages/                  # WebviewProtocol
│       └── webview/                   # CodeJudgeSidebarProvider, templates HTML, CSS e JS
```

---

## Integração com o Backend (CodeJudgeApp)

A extensão consome a API do backend **CodeJudgeApp** (`http://localhost:8000`):

- **`GET /languages`** — Consulta dinâmica das linguagens suportadas configuradas no servidor.
- **`GET /health`** — Verificação de status dos compiladores e do motor de IA.
- **`POST /compilation/run`** — Compilação e verificação de integridade sintática.
- **`POST /execution/run`** — Pipeline de execução de casos de teste em sandbox.
- **`POST /diagnostic/run`** — Diagnóstico de erros e divergências lógicas.
- **`POST /analysis/run`** — Avaliação técnica de código com nota de 0 a 10.
- **`POST /optimization/run`** — Recomendações de eficiência assintótica e memória.
- **`GET /prompts/all`** — Catálogo de templates de IA disponíveis.

---

## Como Executar e Depurar

1. Inicie o backend `CodeJudgeApp` na porta 8000:
   ```bash
   cd CodeJudgeApp
   python Main.py
   ```
2. Abra a pasta `CodeJudgeExtension` no VS Code.
3. Instale as dependências e compile:
   ```bash
   npm install
   npm run compile
   ```
4. Pressione **F5** para iniciar o **Extension Development Host**.
5. Abra qualquer arquivo de código ou exemplo da pasta `CodeJudgeApp/Examples` e utilize o painel lateral do **CodeJudge**. A linguagem será detectada automaticamente e validada com o backend!

---

## Autor e Licença

Desenvolvido por **Everton**.  
Distribuído sob a Licença MIT.
