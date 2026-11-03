# CodeJudge - Extensão para o Visual Studio Code (v2.0.0)

Extensão interativa para o Visual Studio Code desenvolvida por **Everton** para aceleração e apoio ao aprendizado de programação com suporte a múltiplas linguagens (**C, C++, Java, Python** e quaisquer novas linguagens configuradas no backend).

A extensão identifica automaticamente a linguagem do arquivo aberto no editor, sincroniza as linguagens e os modelos de IA suportados em tempo real com o backend, executa baterias de testes com arquivos `.txt`, permite configurar opcionalmente uma **API Key e modelo de IA personalizado** de forma discreta na barra lateral, apresenta diagnósticos formativos guiados por IA e gera relatórios técnicos com exportação para PDF.

---

## Recursos Principais

- **Identificação Automática de Linguagem:**
  - O usuário **não precisa selecionar a linguagem manualmente**. A extensão detecta a linguagem diretamente pelo arquivo ativo no editor (via extensão e `languageId`).
  - O cartão de arquivo ativo exibe instantaneamente a badge com a linguagem reconhecida (`C`, `C++`, `JAVA`, `PYTHON`) e valida se a linguagem é suportada pelo backend.
- **Sincronização Dinâmica com o Servidor (`/languages` e `/ai/models`):**
  - Consome os endpoints `GET /languages` e `GET /ai/models` do backend **CodeJudgeApp** com deduplicação de requisições em trânsito e cache de curta duração (TTL) para evitar chamadas redundantes.
  - Reconhece novas linguagens e novos modelos de IA configurados no `Configuration.json` do servidor sem necessidade de recompilar a extensão.
- **Configuração Discreta de IA & API Key:**
  - Ícone discreto de chave (`#aiConfigToggleBtn`) no cabeçalho da barra lateral com ponto indicador de status (verde quando há chave/modelo personalizado configurado; âmbar quando o servidor exige chave obrigatória via `isUserKeyRequired: true`).
  - Gaveta retrátil compacta (`#aiConfigDrawer`) para seleção de qualquer modelo suportado pelo servidor (como `gemini-3.8-flash`, `gemini-3.8-pro`, `gemini-3.5-flash`, `gemini-2.5-flash`, `llama3:latest`, `qwen2.5-coder:latest`) e inserção opcional ou obrigatória da `API Key`, persistida localmente no estado da extensão.
- **Runner de Testes Automatizados:**
  - Suporte ao carregamento de arquivos de entrada (`inputs.txt`) e gabarito de saída esperada (`outputs.txt`).
  - Execução linha por linha em sandbox isolado com cálculo de taxa de acerto e tabela comparativa entre entrada, saída obtida e gabarito esperado.
- **Diagnóstico Formativo com IA (Compilação e Execução):**
  - Quando uma compilação ou execução falha, o relatório incorpora automaticamente o diagnóstico formativo socrático gerado pela IA usando os templates de erro do servidor.
- **Relatório Técnico & Exportação em PDF:**
  - Abertura de relatórios em Markdown diretamente ao lado do editor ativo e exportação nativa para PDF via PDFKit.

---

## Arquitetura da Extensão (Clean Architecture)

A extensão é estruturada seguindo os princípios da **Clean Architecture**, com reutilização de contratos de etapa (`StageContract`), caso de uso base (`BaseStageUseCase`) e cliente HTTP base (`BaseHttpGateway`):

```
CodeJudgeExtension/
├── configuration.json                 # Configuração padrão de conectividade com a API
├── package.json                       # Metadados, comandos e contribuições do VS Code
├── tsconfig.json                      # Configuração estrita do TypeScript
│
├── src/
│   ├── extension.ts                   # Composition Root e ativação da extensão
│   │
│   ├── core/                          # Entidades, contratos fundamentais e utilitários
│   │   ├── config/                    # ConfigLoader e AppConfig
│   │   ├── entities/                  # Report, TestCase, StageContract (AiRequestOptions, BaseStageRequest)
│   │   ├── errors/                    # AppError, NoActiveEditorError, UnsupportedLanguageError, EmptyCodeError
│   │   ├── languages/                 # LanguageRegistry e LanguageDefinition
│   │   ├── logger/                    # ILogger e VsCodeOutputLogger
│   │   └── utils/                     # EncodingUtils
│   │
│   ├── features/                      # Casos de uso e contratos de gateway por funcionalidade
│   │   ├── common/                    # BaseStageUseCase (template method com telemetria e repasse de IA)
│   │   ├── analyze/                   # AnalyzeUseCase, IAnalyzeGateway e HttpAnalyzeGateway
│   │   ├── compile/                   # CompileUseCase, ICompileGateway e HttpCompileGateway
│   │   ├── execute/                   # ExecuteUseCase, IExecuteGateway e HttpExecuteGateway
│   │   ├── health/                    # CheckHealthUseCase (status da API e sincronização de /ai/models)
│   │   ├── languages/                 # SyncLanguagesUseCase (com cache TTL e deduplicação) e HttpLanguageGateway
│   │   ├── optimize/                  # OptimizeUseCase, IOptimizeGateway e HttpOptimizeGateway
│   │   ├── pdf/                       # PdfExportUseCase, IPdfGenerator e PdfKitReportGenerator
│   │   ├── process/                   # ProcessUseCase (orquestrador do pipeline) e ProcessDTO
│   │   └── prompts/                   # LoadPromptsUseCase, ViewPromptUseCase e HttpPromptGateway
│   │
│   ├── infrastructure/                # Adaptadores de comunicação HTTP, armazenamento e VS Code
│   │   ├── http/                      # BaseHttpGateway (cliente HTTP base com AbortController, X-Api-Key e fixEncoding)
│   │   ├── storage/                   # FileStorageService e IFileStorageService
│   │   └── vscode/                    # VsCodeEditorAdapter e IVsCodeEditorAdapter
│   │
│   └── presentation/                  # Controladores e camada de interface Webview
│       ├── controllers/               # ProcessController, PromptController, HealthController
│       ├── messages/                  # WebviewProtocol
│       └── webview/                   # CodeJudgeSidebarProvider e assets (index.html, style.css, app.js)
```

---

## Integração com o Backend (CodeJudgeApp)

A extensão consome a API do backend **CodeJudgeApp** (`http://localhost:8000`):

- **`GET /languages`** — Consulta dinâmica das linguagens suportadas configuradas no servidor.
- **`GET /ai/models`** — Consulta dos provedores, modelos de IA suportados e política `isUserKeyRequired`.
- **`GET /health`** — Verificação de conectividade dos compiladores e do motor de IA.
- **`POST /compilation/run`** — Compilação e diagnóstico formativo automático em caso de erro sintático.
- **`POST /execution/run`** — Execução de código e validação de casos de teste em sandbox isolado.
- **`POST /analysis/run`** — Avaliação técnica de código com nota de 0 a 10.
- **`POST /optimization/run`** — Recomendações de eficiência assintótica (Big-O) e memória.
- **`GET /prompts/all`** e **`GET /prompts/single/{category}/{promptKey}`** — Catálogo de templates pedagógicos de IA.

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
5. Abra qualquer arquivo de código e utilize o painel lateral do **CodeJudge**.

---

## Autor e Licença

Desenvolvido por **Everton** &bull; **Instituto Federal Fluminense (IFF)**.  
Distribuído sob a Licença MIT.
