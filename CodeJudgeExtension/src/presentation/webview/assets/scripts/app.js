(function () {
  const vscode = acquireVsCodeApi();

  let activeEditorState = null;
  let lastReportPath = null;
  let lastReportMarkdown = null;
  let promptsCatalog = {};
  let inputFileData = '';
  let outputFileData = '';
  let selectedMode = 'full';
  let processTimeoutId = null;
  const TIMEOUT_MS = 45000;

  const savedVsState = vscode.getState() || {};
  let aiPreferences = {
    apiKey: savedVsState.apiKey || '',
    engine: savedVsState.engine || '',
    model: savedVsState.model || ''
  };
  let serverAiConfig = null;

  const buttonLabels = {
    full: 'Processar Código',
    compile: 'Compilar Código',
    execute: 'Executar Código',
    analyze: 'Analisar Código',
    optimize: 'Otimizar Código'
  };

  const elements = {
    apiStatusBtn: document.getElementById('apiStatusBtn'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),

    aiConfigToggleBtn: document.getElementById('aiConfigToggleBtn'),
    aiKeyDot: document.getElementById('aiKeyDot'),
    aiConfigDrawer: document.getElementById('aiConfigDrawer'),
    aiPolicyLabel: document.getElementById('aiPolicyLabel'),
    aiKeyResetBtn: document.getElementById('aiKeyResetBtn'),
    aiModelSelect: document.getElementById('aiModelSelect'),
    aiKeyInput: document.getElementById('aiKeyInput'),
    aiKeyVisBtn: document.getElementById('aiKeyVisBtn'),

    tabProcessBtn: document.getElementById('tabProcessBtn'),
    tabPromptsBtn: document.getElementById('tabPromptsBtn'),
    paneProcess: document.getElementById('paneProcess'),
    panePrompts: document.getElementById('panePrompts'),

    activeFileCard: document.getElementById('activeFileCard'),
    fileName: document.getElementById('fileName'),
    langBadge: document.getElementById('langBadge'),

    dropdownContainer: document.getElementById('dropdownContainer'),
    dropdownTriggerBtn: document.getElementById('dropdownTriggerBtn'),
    dropdownCurrentLabel: document.getElementById('dropdownCurrentLabel'),
    dropdownPopover: document.getElementById('dropdownPopover'),
    dropdownOptions: document.querySelectorAll('.dropdown-option'),

    statementInput: document.getElementById('statementInput'),

    testsAccordion: document.getElementById('testsAccordion'),
    testsAccordionHeader: document.getElementById('testsAccordionHeader'),

    inputDropzone: document.getElementById('inputDropzone'),
    inputFile: document.getElementById('inputFile'),
    inputFileBadge: document.getElementById('inputFileBadge'),
    inputFileName: document.getElementById('inputFileName'),
    toggleInputPreviewBtn: document.getElementById('toggleInputPreviewBtn'),
    inputContentPreview: document.getElementById('inputContentPreview'),
    removeInputBtn: document.getElementById('removeInputBtn'),

    outputDropzone: document.getElementById('outputDropzone'),
    outputFile: document.getElementById('outputFile'),
    outputFileBadge: document.getElementById('outputFileBadge'),
    outputFileName: document.getElementById('outputFileName'),
    toggleOutputPreviewBtn: document.getElementById('toggleOutputPreviewBtn'),
    outputContentPreview: document.getElementById('outputContentPreview'),
    removeOutputBtn: document.getElementById('removeOutputBtn'),

    mainExecuteBtn: document.getElementById('mainExecuteBtn'),
    btnText: document.getElementById('btnText'),

    stepperCard: document.getElementById('stepperCard'),
    stepperGlobalStatus: document.getElementById('stepperGlobalStatus'),
    stepCompile: document.getElementById('step-compile'),
    stepExecute: document.getElementById('step-execute'),
    stepAnalyze: document.getElementById('step-analyze'),
    stepOptimize: document.getElementById('step-optimize'),
    tagCompile: document.getElementById('tag-compile'),
    tagExecute: document.getElementById('tag-execute'),
    tagAnalyze: document.getElementById('tag-analyze'),
    tagOptimize: document.getElementById('tag-optimize'),

    summaryBanner: document.getElementById('summaryBanner'),
    summaryHeader: document.getElementById('summaryHeader'),
    summaryText: document.getElementById('summaryText'),
    openReportMdBtn: document.getElementById('openReportMdBtn'),
    openReportPdfBtn: document.getElementById('openReportPdfBtn'),

    promptsListContainer: document.getElementById('promptsListContainer'),

    errorModal: document.getElementById('errorModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    btnModalClose: document.getElementById('btnModalClose')
  };

  function init() {
    setupTabs();
    setupCustomDropdown();
    setupAccordions();
    setupFileUploads();
    setupProcessExecution();
    setupModal();
    setupApiStatus();
    setupDiscreetAiConfig();

    vscode.postMessage({ type: 'request-active-editor' });
    vscode.postMessage({ type: 'request-health' });
  }

  function persistAiPreferences() {
    vscode.setState({
      ...vscode.getState(),
      apiKey: aiPreferences.apiKey,
      engine: aiPreferences.engine,
      model: aiPreferences.model
    });
    updateAiIndicator();
  }

  function updateAiIndicator() {
    if (!elements.aiKeyDot || !elements.aiConfigToggleBtn) return;
    const hasCustom = Boolean(
      (aiPreferences.apiKey && aiPreferences.apiKey.trim()) ||
      (aiPreferences.model && aiPreferences.model.trim())
    );
    const isRequiredMissing = Boolean(
      serverAiConfig &&
      serverAiConfig.isUserKeyRequired &&
      (!aiPreferences.apiKey || !aiPreferences.apiKey.trim())
    );

    if (isRequiredMissing) {
      elements.aiKeyDot.className = 'ai-key-dot required';
      elements.aiConfigToggleBtn.title = 'API Key obrigatória pelo servidor';
    } else if (hasCustom) {
      elements.aiKeyDot.className = 'ai-key-dot configured';
      elements.aiConfigToggleBtn.title = `IA configurada (${aiPreferences.model || aiPreferences.engine || 'Chave própria'})`;
    } else {
      elements.aiKeyDot.className = 'ai-key-dot';
      elements.aiConfigToggleBtn.title = 'Configurar API Key e Modelo de IA (Opcional)';
    }
  }

  function populateAiModelSelect(aiModels) {
    if (!elements.aiModelSelect) return;
    const select = elements.aiModelSelect;
    const currentValue =
      aiPreferences.engine && aiPreferences.model
        ? `${aiPreferences.engine}::${aiPreferences.model}`
        : '';

    select.innerHTML = '';

    if (!aiModels || !aiModels.isUserKeyRequired) {
      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = aiModels?.defaultModel
        ? `Padrão do Servidor (${aiModels.defaultModel})`
        : 'Padrão do Servidor';
      select.appendChild(defOpt);
    }

    const engines = Array.isArray(aiModels?.engines) && aiModels.engines.length > 0
      ? aiModels.engines
      : [
          {
            key: 'gemini',
            name: 'Google Gemini',
            supportedModels: ['gemini-3.8-flash', 'gemini-3.8-pro', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
          },
          {
            key: 'ollama',
            name: 'Ollama (Local)',
            supportedModels: ['llama3:latest', 'qwen2.5-coder:latest', 'deepseek-coder:latest']
          }
        ];

    engines.forEach(eng => {
      const group = document.createElement('optgroup');
      group.label = eng.name || eng.key;
      (eng.supportedModels || []).forEach(mdl => {
        const opt = document.createElement('option');
        opt.value = `${eng.key}::${mdl}`;
        opt.textContent = mdl;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });

    if (currentValue) {
      select.value = currentValue;
    } else if (aiModels?.isUserKeyRequired && select.options.length > 0) {
      select.selectedIndex = 0;
      const parts = (select.value || '').split('::');
      aiPreferences.engine = parts[0] || '';
      aiPreferences.model = parts[1] || '';
    }
  }

  function setupDiscreetAiConfig() {
    if (!elements.aiConfigToggleBtn) return;

    elements.aiKeyInput.value = aiPreferences.apiKey || '';
    populateAiModelSelect(null);
    updateAiIndicator();

    elements.aiConfigToggleBtn.addEventListener('click', () => {
      const isOpen = elements.aiConfigDrawer.classList.toggle('open');
      elements.aiConfigToggleBtn.classList.toggle('open', isOpen);
    });

    elements.aiModelSelect.addEventListener('change', () => {
      const val = elements.aiModelSelect.value;
      if (!val) {
        aiPreferences.engine = '';
        aiPreferences.model = '';
      } else {
        const [eng, mdl] = val.split('::');
        aiPreferences.engine = eng || '';
        aiPreferences.model = mdl || '';
      }
      persistAiPreferences();
    });

    elements.aiKeyInput.addEventListener('input', () => {
      aiPreferences.apiKey = elements.aiKeyInput.value.trim();
      if (aiPreferences.apiKey && !aiPreferences.engine) {
        aiPreferences.engine = 'gemini';
      }
      persistAiPreferences();
    });

    elements.aiKeyVisBtn.addEventListener('click', () => {
      const isPwd = elements.aiKeyInput.type === 'password';
      elements.aiKeyInput.type = isPwd ? 'text' : 'password';
      elements.aiKeyVisBtn.textContent = isPwd ? 'Ocultar' : 'Ver';
    });

    elements.aiKeyResetBtn.addEventListener('click', () => {
      aiPreferences.apiKey = '';
      aiPreferences.engine = '';
      aiPreferences.model = '';
      elements.aiKeyInput.value = '';
      elements.aiModelSelect.value = '';
      persistAiPreferences();
    });
  }

  function setupTabs() {
    elements.tabProcessBtn.addEventListener('click', () => {
      elements.tabProcessBtn.classList.add('active');
      elements.tabPromptsBtn.classList.remove('active');
      elements.paneProcess.classList.add('active');
      elements.panePrompts.classList.remove('active');
    });

    elements.tabPromptsBtn.addEventListener('click', () => {
      elements.tabPromptsBtn.classList.add('active');
      elements.tabProcessBtn.classList.remove('active');
      elements.panePrompts.classList.add('active');
      elements.paneProcess.classList.remove('active');

      if (Object.keys(promptsCatalog).length === 0) {
        vscode.postMessage({ type: 'load-prompts' });
      }
    });
  }

  function clearOutputs() {
    elements.summaryBanner.classList.remove('active');
    elements.stepperCard.classList.remove('active');
    lastReportPath = null;
    lastReportMarkdown = null;

    [elements.stepCompile, elements.stepExecute, elements.stepAnalyze, elements.stepOptimize].forEach(item => {
      if (item) item.classList.remove('running');
    });

    setStageTag(elements.tagCompile, 'pending', 'Pendente');
    setStageTag(elements.tagExecute, 'pending', 'Pendente');
    setStageTag(elements.tagAnalyze, 'pending', 'Pendente');
    setStageTag(elements.tagOptimize, 'pending', 'Pendente');
    elements.stepperGlobalStatus.textContent = 'Aguardando...';
  }

  function setupCustomDropdown() {
    elements.dropdownTriggerBtn.addEventListener('click', e => {
      e.stopPropagation();
      elements.dropdownContainer.classList.toggle('open');
    });

    document.addEventListener('click', e => {
      if (!elements.dropdownContainer.contains(e.target)) {
        elements.dropdownContainer.classList.remove('open');
      }
    });

    elements.dropdownOptions.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');
        selectedMode = value;

        clearOutputs();

        elements.dropdownOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        const titleEl = option.querySelector('.dropdown-option-header span');
        if (titleEl) {
          elements.dropdownCurrentLabel.textContent = titleEl.textContent;
        }

        elements.dropdownContainer.classList.remove('open');

        if (!elements.mainExecuteBtn.classList.contains('loading')) {
          elements.btnText.textContent = buttonLabels[selectedMode] || 'Processar Código';
        }

        if (selectedMode === 'execute' && !elements.testsAccordion.classList.contains('open')) {
          elements.testsAccordion.classList.add('open');
        }
      });
    });
  }

  function getProcessConfig(mode) {
    switch (mode) {
      case 'compile':
        return { compile: true, execute: false, analyze: false, optimize: false };
      case 'execute':
        return { compile: false, execute: true, analyze: false, optimize: false };
      case 'analyze':
        return { compile: false, execute: false, analyze: true, optimize: false };
      case 'optimize':
        return { compile: false, execute: false, analyze: false, optimize: true };
      case 'full':
      default:
        return { compile: true, execute: true, analyze: true, optimize: true };
    }
  }

  function setupAccordions() {
    elements.testsAccordionHeader.addEventListener('click', () => {
      elements.testsAccordion.classList.toggle('open');
    });
  }

  function setupFileUploads() {
    bindDropzone(
      elements.inputDropzone,
      elements.inputFile,
      elements.inputFileBadge,
      elements.inputFileName,
      elements.removeInputBtn,
      elements.toggleInputPreviewBtn,
      elements.inputContentPreview,
      content => { inputFileData = content; }
    );

    bindDropzone(
      elements.outputDropzone,
      elements.outputFile,
      elements.outputFileBadge,
      elements.outputFileName,
      elements.removeOutputBtn,
      elements.toggleOutputPreviewBtn,
      elements.outputContentPreview,
      content => { outputFileData = content; }
    );
  }

  function bindDropzone(dropzone, inputEl, badgeEl, nameTextEl, removeBtn, togglePreviewBtn, previewEl, onData) {
    dropzone.addEventListener('click', () => inputEl.click());

    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        readFile(e.dataTransfer.files[0], dropzone, badgeEl, nameTextEl, previewEl, togglePreviewBtn, onData);
      }
    });

    inputEl.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        readFile(e.target.files[0], dropzone, badgeEl, nameTextEl, previewEl, togglePreviewBtn, onData);
      }
    });

    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      inputEl.value = '';
      onData('');
      badgeEl.classList.remove('active');
      dropzone.style.display = 'flex';
      previewEl.classList.remove('open');
      previewEl.textContent = '';
      togglePreviewBtn.textContent = 'Ver conteúdo';
    });

    togglePreviewBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = previewEl.classList.toggle('open');
      togglePreviewBtn.textContent = isOpen ? 'Ocultar conteúdo' : 'Ver conteúdo';
    });
  }

  function readFile(file, dropzone, badgeEl, nameTextEl, previewEl, togglePreviewBtn, onData) {
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target.result || '';
      onData(text);
      previewEl.textContent = text;
      previewEl.classList.remove('open');
      togglePreviewBtn.textContent = 'Ver conteúdo';
      nameTextEl.textContent = `${file.name} (${text.split('\n').length} linhas)`;
      dropzone.style.display = 'none';
      badgeEl.classList.add('active');
    };
    reader.readAsText(file);
  }

  function setupProcessExecution() {
    elements.mainExecuteBtn.addEventListener('click', () => {
      const config = getProcessConfig(selectedMode);

      resetStepper(config);
      elements.stepperCard.classList.add('active');
      elements.summaryBanner.classList.remove('active');

      setLoading(true);

      if (processTimeoutId) {
        clearTimeout(processTimeoutId);
      }
      processTimeoutId = setTimeout(handleProcessTimeout, TIMEOUT_MS);

      const statement = elements.statementInput.value.trim();
      let tests = [];

      if (inputFileData || outputFileData) {
        const inLines = inputFileData.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        const outLines = outputFileData.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        const maxLen = Math.max(inLines.length, outLines.length);

        for (let i = 0; i < maxLen; i++) {
          tests.push({
            input: inLines[i] || '',
            expected: outLines[i] || ''
          });
        }
      }

      vscode.postMessage({
        type: 'start-process',
        payload: {
          statement,
          config,
          tests,
          apiKey: aiPreferences.apiKey || undefined,
          engine: aiPreferences.engine || undefined,
          model: aiPreferences.model || undefined
        }
      });
    });

    elements.openReportMdBtn.addEventListener('click', () => {
      if (lastReportPath) {
        vscode.postMessage({
          type: 'open-file-preview',
          payload: { filePath: lastReportPath }
        });
      }
    });

    elements.openReportPdfBtn.addEventListener('click', () => {
      if (lastReportPath || lastReportMarkdown) {
        vscode.postMessage({
          type: 'export-pdf',
          payload: {
            filePath: lastReportPath,
            base64: lastReportMarkdown ? btoa(unescape(encodeURIComponent(lastReportMarkdown))) : undefined
          }
        });
      }
    });
  }

  function handleProcessTimeout() {
    setLoading(false);
    elements.stepperGlobalStatus.textContent = 'Tempo limite excedido.';
    showModal('Tempo Limite Excedido', 'O processamento demorou mais que o esperado para responder. O botão foi reativado para você tentar novamente.');
    vscode.postMessage({
      type: 'show-error',
      payload: { message: 'O processamento do código excedeu o tempo limite de resposta.' }
    });
  }

  function setLoading(loading) {
    elements.mainExecuteBtn.disabled = loading;
    if (loading) {
      elements.mainExecuteBtn.classList.add('loading');
      elements.btnText.textContent = 'Processando...';
    } else {
      elements.mainExecuteBtn.classList.remove('loading');
      elements.btnText.textContent = buttonLabels[selectedMode] || 'Processar Código';
    }
  }

  function resetStepper(config) {
    elements.stepperGlobalStatus.textContent = 'Iniciando processamento...';

    [elements.stepCompile, elements.stepExecute, elements.stepAnalyze, elements.stepOptimize].forEach(item => {
      if (item) item.classList.remove('running');
    });

    setStageTag(elements.tagCompile, config.compile ? 'pending' : 'skipped', config.compile ? 'Pendente' : 'Desmarcado');
    setStageTag(elements.tagExecute, config.execute ? 'pending' : 'skipped', config.execute ? 'Pendente' : 'Desmarcado');
    setStageTag(elements.tagAnalyze, config.analyze ? 'pending' : 'skipped', config.analyze ? 'Pendente' : 'Desmarcado');
    setStageTag(elements.tagOptimize, config.optimize ? 'pending' : 'skipped', config.optimize ? 'Pendente' : 'Desmarcado');
  }

  function setStageTag(tagEl, statusClass, text) {
    tagEl.className = `step-status-tag ${statusClass}`;
    tagEl.textContent = text;
  }

  function setupModal() {
    elements.btnModalClose.addEventListener('click', () => {
      elements.errorModal.classList.remove('active');
    });

    elements.errorModal.addEventListener('click', e => {
      if (e.target === elements.errorModal) {
        elements.errorModal.classList.remove('active');
      }
    });
  }

  function showModal(title, message) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.errorModal.classList.add('active');
  }

  function setupApiStatus() {
    elements.apiStatusBtn.addEventListener('click', () => {
      elements.statusText.textContent = 'Verificando...';
      vscode.postMessage({ type: 'request-health' });
    });
  }

  window.addEventListener('message', event => {
    const message = event.data;
    if (!message) return;

    switch (message.type) {
      case 'active-editor-changed':
        handleEditorChanged(message.payload);
        break;

      case 'health-status':
        handleHealthStatus(message.payload);
        break;

      case 'process-started':
        resetStepper(message.payload.config);
        break;

      case 'stage-progress':
        handleStageProgress(message.payload);
        break;

      case 'process-finished':
        if (processTimeoutId) {
          clearTimeout(processTimeoutId);
          processTimeoutId = null;
        }
        handleProcessFinished(message.payload);
        break;

      case 'process-error':
        if (processTimeoutId) {
          clearTimeout(processTimeoutId);
          processTimeoutId = null;
        }
        handleProcessError(message.payload);
        break;

      case 'prompts-loaded':
        handlePromptsLoaded(message.payload);
        break;

      case 'prompts-error':
        elements.promptsListContainer.innerHTML = `<div class="prompts-loading-text">Não foi possível carregar os prompts da API.</div>`;
        break;
    }
  });

  function handleEditorChanged(state) {
    if (!state.hasEditor) {
      return;
    }

    if (state.fileName && (state.fileName.startsWith('codejudge_relatorio_') || state.fileName.endsWith('.md') || state.fileName.endsWith('.pdf'))) {
      return;
    }

    if (activeEditorState?.fileName && state.fileName && activeEditorState.fileName !== state.fileName && state.isSupported) {
      clearOutputs();
    }

    activeEditorState = state;
    elements.fileName.textContent = state.fileName || 'Sem nome';

    if (state.isSupported) {
      elements.langBadge.textContent = (state.languageId || '').toUpperCase();
      elements.langBadge.className = 'lang-badge supported';
      elements.mainExecuteBtn.disabled = false;
    } else {
      elements.langBadge.textContent = `${state.languageId} (Não suportado)`;
      elements.langBadge.className = 'lang-badge unsupported';
      elements.mainExecuteBtn.disabled = true;
    }
  }

  function handleHealthStatus({ online, apiUrl, aiModels }) {
    elements.statusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
    elements.statusText.textContent = online ? 'Online' : 'Offline';
    elements.apiStatusBtn.title = `API: ${apiUrl} (${online ? 'Conectado' : 'Indisponível'})`;

    if (aiModels) {
      serverAiConfig = aiModels;
      if (elements.aiPolicyLabel) {
        elements.aiPolicyLabel.textContent = aiModels.isUserKeyRequired
          ? 'IA & API Key (Obrigatória)'
          : 'IA & API Key (Opcional)';
      }
      if (elements.aiKeyInput) {
        elements.aiKeyInput.placeholder = aiModels.isUserKeyRequired
          ? 'API Key obrigatória pelo servidor...'
          : 'Cole sua API Key (opcional)...';
      }
      populateAiModelSelect(aiModels);
      updateAiIndicator();
      if (aiModels.isUserKeyRequired && (!aiPreferences.apiKey || !aiPreferences.apiKey.trim())) {
        elements.aiConfigDrawer?.classList.add('open');
        elements.aiConfigToggleBtn?.classList.add('open');
      }
    }
  }

  function handleStageProgress(progress) {
    const map = {
      compile: { tag: elements.tagCompile, item: elements.stepCompile },
      execute: { tag: elements.tagExecute, item: elements.stepExecute },
      analyze: { tag: elements.tagAnalyze, item: elements.stepAnalyze },
      optimize: { tag: elements.tagOptimize, item: elements.stepOptimize }
    };

    const entry = map[progress.stage];
    if (!entry) return;

    const labelMap = {
      pending: 'Pendente',
      running: 'Processando',
      success: 'Concluído',
      failed: 'Falha',
      skipped: 'Ignorado'
    };

    if (progress.status === 'running') {
      entry.item.classList.add('running');
    } else {
      entry.item.classList.remove('running');
    }

    setStageTag(entry.tag, progress.status, labelMap[progress.status] || progress.status);
    elements.stepperGlobalStatus.textContent = progress.title;
  }

  function handleProcessFinished(result) {
    setLoading(false);
    lastReportPath = result.filePath;
    lastReportMarkdown = result.markdown;
    elements.summaryBanner.classList.add('active');

    [elements.stepCompile, elements.stepExecute, elements.stepAnalyze, elements.stepOptimize].forEach(item => {
      if (item) item.classList.remove('running');
    });

    if (result.stoppedEarly) {
      elements.summaryHeader.textContent = 'Compilação Interrompida';
      elements.summaryHeader.style.color = 'var(--warning)';
      elements.summaryText.textContent = 'O código apresentou erro de sintaxe. Consulte as orientações no relatório gerado.';
      elements.stepperGlobalStatus.textContent = 'Pausado por erro sintático.';
    } else if (result.allSucceeded) {
      elements.summaryHeader.textContent = 'Processamento Concluído com Sucesso';
      elements.summaryHeader.style.color = 'var(--green-accent)';
      const hasTests = result.successRate !== undefined && result.successRate !== null;
      elements.summaryText.textContent = hasTests
        ? `Aproveitamento nos testes: ${result.successRate}%. Escolha o formato para visualizar:`
        : 'Código processado e aprovado em todas as etapas selecionadas. Escolha o formato para visualizar:';
      elements.stepperGlobalStatus.textContent = 'Etapas concluídas.';
    } else {
      elements.summaryHeader.textContent = 'Processamento Concluído com Observações';
      elements.summaryHeader.style.color = 'var(--text-main)';
      const hasTests = result.successRate !== undefined && result.successRate !== null;
      elements.summaryText.textContent = hasTests
        ? `Aproveitamento nos testes: ${result.successRate}%. Foram identificadas divergências nas saídas.`
        : 'Foram identificadas observações durante o processamento. Consulte o relatório nos botões abaixo.';
      elements.stepperGlobalStatus.textContent = 'Finalizado com observações.';
    }
  }

  function handleProcessError({ message }) {
    setLoading(false);
    elements.summaryBanner.classList.add('active');
    elements.summaryHeader.textContent = 'Falha de Comunicação';
    elements.summaryHeader.style.color = 'var(--danger)';
    elements.summaryText.textContent = message || 'Não foi possível conectar à API do CodeJudge.';
    elements.stepperGlobalStatus.textContent = 'Erro de comunicação.';

    [elements.stepCompile, elements.stepExecute, elements.stepAnalyze, elements.stepOptimize].forEach(item => {
      if (item) item.classList.remove('running');
    });

    showModal('Erro no Processamento', message || 'Não foi possível conectar à API do CodeJudge.');
  }

  function handlePromptsLoaded({ templates }) {
    promptsCatalog = templates || {};
    const container = elements.promptsListContainer;
    container.innerHTML = '';

    const categories = Object.keys(promptsCatalog);
    if (categories.length === 0) {
      container.innerHTML = `<div class="prompts-loading-text">Nenhum prompt disponível no momento.</div>`;
      return;
    }

    categories.forEach(category => {
      const groupEl = document.createElement('div');
      groupEl.className = 'prompt-category-group';

      const titleEl = document.createElement('div');
      titleEl.className = 'prompt-category-title';
      titleEl.textContent = category.toUpperCase();
      groupEl.appendChild(titleEl);

      const items = promptsCatalog[category];
      Object.keys(items).forEach(promptKey => {
        const promptObj = items[promptKey];
        const cardEl = document.createElement('div');
        cardEl.className = 'prompt-card';

        const headerEl = document.createElement('div');
        headerEl.className = 'prompt-card-header';

        const nameEl = document.createElement('span');
        nameEl.className = 'prompt-card-title';
        nameEl.textContent = promptObj.metadata?.name || promptKey;
        headerEl.appendChild(nameEl);

        cardEl.appendChild(headerEl);

        if (promptObj.metadata?.description) {
          const descEl = document.createElement('p');
          descEl.className = 'prompt-card-desc';
          descEl.textContent = promptObj.metadata.description;
          cardEl.appendChild(descEl);
        }

        const openBtn = document.createElement('button');
        openBtn.className = 'btn-prompt-open';
        openBtn.textContent = 'Abrir Prompt';
        openBtn.addEventListener('click', () => {
          vscode.postMessage({
            type: 'view-prompt',
            payload: { category, promptKey }
          });
        });

        cardEl.appendChild(openBtn);
        groupEl.appendChild(cardEl);
      });

      container.appendChild(groupEl);
    });
  }

  init();
})();
