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
  let moodleProfile = savedVsState.moodleProfile || null;
  let moodleLoginTimeoutId = null;
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
    aiModelSyncHint: document.getElementById('aiModelSyncHint'),
    aiKeyResetBtn: document.getElementById('aiKeyResetBtn'),
    aiModelDropdownContainer: document.getElementById('aiModelDropdownContainer'),
    aiModelTriggerBtn: document.getElementById('aiModelTriggerBtn'),
    aiModelCurrentLabel: document.getElementById('aiModelCurrentLabel'),
    aiModelPopover: document.getElementById('aiModelPopover'),
    aiModelSearchBox: document.getElementById('aiModelSearchBox'),
    aiModelSearchInput: document.getElementById('aiModelSearchInput'),
    aiModelOptionsList: document.getElementById('aiModelOptionsList'),
    aiKeyInput: document.getElementById('aiKeyInput'),
    aiKeyVisBtn: document.getElementById('aiKeyVisBtn'),
    aiEyeIcon: document.getElementById('aiEyeIcon'),

    moodleAuthToggleBtn: document.getElementById('moodleAuthToggleBtn'),
    moodleAuthDot: document.getElementById('moodleAuthDot'),
    moodleAuthDrawer: document.getElementById('moodleAuthDrawer'),
    moodleLogoutBtn: document.getElementById('moodleLogoutBtn'),
    moodleLoginFormView: document.getElementById('moodleLoginFormView'),
    moodleProfileView: document.getElementById('moodleProfileView'),
    moodleUsernameInput: document.getElementById('moodleUsernameInput'),
    moodlePasswordInput: document.getElementById('moodlePasswordInput'),
    moodlePassVisBtn: document.getElementById('moodlePassVisBtn'),
    moodleEyeIcon: document.getElementById('moodleEyeIcon'),
    moodleLoginSubmitBtn: document.getElementById('moodleLoginSubmitBtn'),
    moodleAuthFeedback: document.getElementById('moodleAuthFeedback'),
    moodleProfileName: document.getElementById('moodleProfileName'),
    moodleProfileEmail: document.getElementById('moodleProfileEmail'),
    moodleProfileCampus: document.getElementById('moodleProfileCampus'),
    moodleCourseInput: document.getElementById('moodleCourseInput'),
    moodleCoursesChips: document.getElementById('moodleCoursesChips'),

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
    dropdownOptions: document.querySelectorAll('#dropdownPopover .dropdown-option'),

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
    setupMoodleAuth();

    vscode.postMessage({ type: 'request-active-editor' });
    vscode.postMessage({ type: 'request-health' });
    vscode.postMessage({ type: 'request-moodle-session' });
  }

  function persistAiPreferences() {
    vscode.setState({
      ...vscode.getState(),
      apiKey: aiPreferences.apiKey,
      engine: aiPreferences.engine,
      model: aiPreferences.model,
      moodleProfile
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

  function createCheckIconSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'option-check-svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(poly);
    return svg;
  }

  function createModelOptionElement(value, label, description, isSelected, sectionKey) {
    const opt = document.createElement('div');
    opt.className = 'dropdown-option' + (isSelected ? ' selected' : '');
    opt.setAttribute('data-value', value);
    opt.setAttribute('data-label', label);
    opt.setAttribute('data-section', sectionKey || '');
    opt.setAttribute('data-search', `${label} ${description} ${value}`.toLowerCase());

    const header = document.createElement('div');
    header.className = 'dropdown-option-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = label;
    header.appendChild(titleSpan);
    header.appendChild(createCheckIconSvg());

    const desc = document.createElement('div');
    desc.className = 'dropdown-option-desc';
    desc.textContent = description;

    opt.appendChild(header);
    opt.appendChild(desc);

    opt.addEventListener('click', e => {
      e.stopPropagation();
      selectAiModelOption(value, label);
      elements.aiModelDropdownContainer?.classList.remove('open');
    });

    return opt;
  }

  function filterAiModelOptions(rawQuery) {
    if (!elements.aiModelOptionsList) return;
    const query = (rawQuery || '').trim().toLowerCase();
    const listContainer = elements.aiModelOptionsList;
    const options = listContainer.querySelectorAll('.dropdown-option');
    const sections = listContainer.querySelectorAll('.dropdown-section-title');
    const visibleBySection = {};
    let totalVisible = 0;

    options.forEach(opt => {
      const searchText = opt.getAttribute('data-search') || '';
      const matches = !query || searchText.includes(query);
      opt.style.display = matches ? 'flex' : 'none';
      if (matches) {
        totalVisible++;
        const sec = opt.getAttribute('data-section') || '';
        visibleBySection[sec] = (visibleBySection[sec] || 0) + 1;
      }
    });

    sections.forEach(secEl => {
      const secKey = secEl.getAttribute('data-section') || '';
      secEl.style.display = visibleBySection[secKey] ? 'block' : 'none';
    });

    let emptyEl = listContainer.querySelector('.ai-model-empty-search');
    if (totalVisible === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'ai-model-empty-search';
        emptyEl.textContent = 'Nenhum modelo encontrado.';
        listContainer.appendChild(emptyEl);
      }
      emptyEl.style.display = 'block';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  function selectAiModelOption(value, label) {
    if (!value) {
      aiPreferences.engine = '';
      aiPreferences.model = '';
    } else {
      const [eng, mdl] = value.split('::');
      aiPreferences.engine = eng || '';
      aiPreferences.model = mdl || '';
    }

    if (elements.aiModelCurrentLabel) {
      elements.aiModelCurrentLabel.textContent = label || 'Padrão do Servidor';
    }

    if (elements.aiModelOptionsList) {
      const allOpts = elements.aiModelOptionsList.querySelectorAll('.dropdown-option');
      allOpts.forEach(node => {
        node.classList.toggle('selected', node.getAttribute('data-value') === value);
      });
    }

    persistAiPreferences();
  }

  function populateAiModelSelect(aiModels) {
    if (!elements.aiModelOptionsList || !elements.aiModelCurrentLabel) return;
    const listContainer = elements.aiModelOptionsList;
    listContainer.innerHTML = '';

    let currentValue =
      aiPreferences.engine && aiPreferences.model
        ? `${aiPreferences.engine}::${aiPreferences.model}`
        : '';

    const rawEngines = Array.isArray(aiModels?.engines) && aiModels.engines.length > 0
      ? aiModels.engines
      : aiModels?.providers && typeof aiModels.providers === 'object'
        ? Object.entries(aiModels.providers).map(([key, list]) => ({
            key,
            name: key.toUpperCase(),
            supportedModels: Array.isArray(list) ? list : [],
            requiresApiKey: key !== 'ollama'
          }))
        : [];

    if (!aiModels || rawEngines.length === 0) {
      if (elements.aiModelSyncHint) {
        elements.aiModelSyncHint.textContent = 'Aguardando servidor...';
      }
      const section = document.createElement('div');
      section.className = 'dropdown-section-title';
      section.setAttribute('data-section', 'server');
      section.textContent = 'Servidor';
      listContainer.appendChild(section);

      const defaultLabel = aiPreferences.model || 'Padrão do Servidor';
      listContainer.appendChild(
        createModelOptionElement(
          currentValue,
          defaultLabel,
          'Conecte ao servidor para carregar a lista de modelos',
          true,
          'server'
        )
      );
      elements.aiModelCurrentLabel.textContent = defaultLabel;
      return;
    }

    const validValues = new Set(['']);
    let totalModelsCount = 0;
    rawEngines.forEach(eng => {
      const list = Array.isArray(eng.supportedModels) ? eng.supportedModels : [];
      totalModelsCount += list.length;
      list.forEach(mdl => validValues.add(`${eng.key}::${mdl}`));
    });

    if (currentValue && !validValues.has(currentValue)) {
      const matchingEng = rawEngines.find(e => e.key === aiPreferences.engine);
      if (matchingEng && matchingEng.defaultModel && validValues.has(`${matchingEng.key}::${matchingEng.defaultModel}`)) {
        aiPreferences.model = matchingEng.defaultModel;
        currentValue = `${matchingEng.key}::${matchingEng.defaultModel}`;
      } else {
        aiPreferences.engine = '';
        aiPreferences.model = '';
        currentValue = '';
      }
      persistAiPreferences();
    }

    if (elements.aiModelSyncHint) {
      elements.aiModelSyncHint.textContent = `${totalModelsCount} modelos disponíveis`;
    }

    if (aiModels.isUserKeyRequired && !currentValue && rawEngines[0]?.supportedModels?.[0]) {
      aiPreferences.engine = rawEngines[0].key;
      aiPreferences.model = rawEngines[0].supportedModels[0];
      currentValue = `${aiPreferences.engine}::${aiPreferences.model}`;
    }

    let selectedLabel = '';

    if (!aiModels.isUserKeyRequired) {
      const recSection = document.createElement('div');
      recSection.className = 'dropdown-section-title';
      recSection.setAttribute('data-section', 'server');
      recSection.textContent = 'Servidor';
      listContainer.appendChild(recSection);

      const defTitle = aiModels.defaultModel
        ? `Padrão do Servidor (${aiModels.defaultModel})`
        : 'Padrão do Servidor';
      const defDesc = aiModels.defaultEngine
        ? `Motor padrão do servidor (${aiModels.defaultEngine})`
        : 'Usar modelo configurado no servidor';
      const isDefSelected = currentValue === '';
      if (isDefSelected) {
        selectedLabel = defTitle;
      }
      listContainer.appendChild(createModelOptionElement('', defTitle, defDesc, isDefSelected, 'server'));
    }

    rawEngines.forEach(eng => {
      const modelsList = Array.isArray(eng.supportedModels) ? eng.supportedModels : [];
      if (modelsList.length === 0) return;

      const secKey = `eng_${eng.key}`;
      const secTitle = document.createElement('div');
      secTitle.className = 'dropdown-section-title';
      secTitle.setAttribute('data-section', secKey);
      secTitle.textContent = eng.name || eng.key;
      listContainer.appendChild(secTitle);

      const descText = eng.requiresApiKey
        ? `${eng.name || eng.key} • Requer API Key`
        : `${eng.name || eng.key} • Execução no Servidor`;

      modelsList.forEach(mdl => {
        const val = `${eng.key}::${mdl}`;
        const isSel = currentValue === val;
        if (isSel) {
          selectedLabel = mdl;
        }
        listContainer.appendChild(createModelOptionElement(val, mdl, descText, isSel, secKey));
      });
    });

    if (!selectedLabel) {
      selectedLabel = aiPreferences.model || (aiModels.defaultModel ? `Padrão do Servidor (${aiModels.defaultModel})` : 'Padrão do Servidor');
    }
    elements.aiModelCurrentLabel.textContent = selectedLabel;

    if (elements.aiModelSearchInput && elements.aiModelSearchInput.value) {
      filterAiModelOptions(elements.aiModelSearchInput.value);
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
      if (isOpen) {
        elements.moodleAuthDrawer?.classList.remove('open');
        elements.moodleAuthToggleBtn?.classList.remove('open');
        if (!serverAiConfig) {
          vscode.postMessage({ type: 'request-health' });
        }
      } else {
        elements.aiModelDropdownContainer?.classList.remove('open');
      }
    });

    if (elements.aiModelTriggerBtn && elements.aiModelDropdownContainer) {
      elements.aiModelTriggerBtn.addEventListener('click', e => {
        e.stopPropagation();
        elements.dropdownContainer?.classList.remove('open');
        const isOpen = elements.aiModelDropdownContainer.classList.toggle('open');
        if (isOpen) {
          if (elements.aiModelSearchInput) {
            elements.aiModelSearchInput.value = '';
            filterAiModelOptions('');
            setTimeout(() => elements.aiModelSearchInput.focus(), 20);
          }
          if (!serverAiConfig) {
            vscode.postMessage({ type: 'request-health' });
          }
        }
      });
    }

    if (elements.aiModelSearchBox) {
      elements.aiModelSearchBox.addEventListener('click', e => {
        e.stopPropagation();
      });
    }

    if (elements.aiModelSearchInput) {
      elements.aiModelSearchInput.addEventListener('input', () => {
        filterAiModelOptions(elements.aiModelSearchInput.value);
      });
    }

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
      if (elements.aiEyeIcon) {
        elements.aiEyeIcon.innerHTML = isPwd
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    });

    elements.aiKeyResetBtn.addEventListener('click', () => {
      aiPreferences.apiKey = '';
      aiPreferences.engine = '';
      aiPreferences.model = '';
      elements.aiKeyInput.value = '';
      populateAiModelSelect(serverAiConfig);
      persistAiPreferences();
    });
  }

  function setupMoodleAuth() {
    if (!elements.moodleAuthToggleBtn || !elements.moodleAuthDrawer) return;

    renderMoodleSession(moodleProfile);

    elements.moodleAuthToggleBtn.addEventListener('click', () => {
      const isOpen = elements.moodleAuthDrawer.classList.toggle('open');
      elements.moodleAuthToggleBtn.classList.toggle('open', isOpen);
      if (isOpen) {
        elements.aiConfigDrawer?.classList.remove('open');
        elements.aiConfigToggleBtn?.classList.remove('open');
        elements.aiModelDropdownContainer?.classList.remove('open');
      }
    });

    if (elements.moodlePassVisBtn && elements.moodlePasswordInput) {
      elements.moodlePassVisBtn.addEventListener('click', () => {
        const isPwd = elements.moodlePasswordInput.type === 'password';
        elements.moodlePasswordInput.type = isPwd ? 'text' : 'password';
        if (elements.moodleEyeIcon) {
          elements.moodleEyeIcon.innerHTML = isPwd
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
      });
    }

    const triggerMoodleLogin = () => {
      const username = (elements.moodleUsernameInput?.value || '').trim();
      const password = elements.moodlePasswordInput?.value || '';
      const courseOverride = (elements.moodleCourseInput?.value || '').trim();

      if (!username || !password) {
        if (elements.moodleAuthFeedback) {
          elements.moodleAuthFeedback.textContent = 'Preencha sua matrícula/usuário e senha do Moodle.';
          elements.moodleAuthFeedback.className = 'moodle-feedback-msg error';
        }
        return;
      }

      if (elements.moodleLoginSubmitBtn) {
        elements.moodleLoginSubmitBtn.disabled = true;
        elements.moodleLoginSubmitBtn.textContent = 'Autenticando no Moodle...';
      }
      if (elements.moodleAuthFeedback) {
        elements.moodleAuthFeedback.textContent = '';
        elements.moodleAuthFeedback.className = 'moodle-feedback-msg';
      }

      if (moodleLoginTimeoutId) {
        clearTimeout(moodleLoginTimeoutId);
      }
      moodleLoginTimeoutId = setTimeout(() => {
        moodleLoginTimeoutId = null;
        if (elements.moodleLoginSubmitBtn) {
          elements.moodleLoginSubmitBtn.disabled = false;
          elements.moodleLoginSubmitBtn.textContent = 'Entrar com Moodle IFF';
        }
        if (elements.moodleAuthFeedback) {
          elements.moodleAuthFeedback.textContent =
            'Sem resposta do host da extensão. Recarregue a janela do VS Code (Ctrl+R / Reload Window) e tente novamente.';
          elements.moodleAuthFeedback.className = 'moodle-feedback-msg error';
        }
      }, 15000);

      vscode.postMessage({
        type: 'moodle-login',
        payload: {
          username,
          password,
          courseOverride: courseOverride || undefined
        }
      });
    };

    elements.moodleLoginSubmitBtn?.addEventListener('click', triggerMoodleLogin);
    elements.moodlePasswordInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerMoodleLogin();
      }
    });

    elements.moodleLogoutBtn?.addEventListener('click', () => {
      moodleProfile = null;
      persistAiPreferences();
      renderMoodleSession(null);
      vscode.postMessage({ type: 'moodle-logout' });
    });

    elements.moodleCourseInput?.addEventListener('change', () => {
      const courseVal = elements.moodleCourseInput.value.trim();
      if (moodleProfile && courseVal) {
        moodleProfile.course = courseVal;
        persistAiPreferences();
        vscode.postMessage({
          type: 'moodle-update-course',
          payload: { course: courseVal }
        });
      }
    });
  }

  function renderMoodleSession(profile) {
    moodleProfile = profile || null;
    persistAiPreferences();

    const isLogged = Boolean(moodleProfile && moodleProfile.name);
    if (elements.moodleAuthDot) {
      elements.moodleAuthDot.className = isLogged ? 'ai-key-dot configured' : 'ai-key-dot';
    }
    if (elements.moodleAuthToggleBtn) {
      elements.moodleAuthToggleBtn.title = isLogged
        ? `Moodle Conectado: ${moodleProfile.name}`
        : 'Login Acadêmico (Moodle IFF)';
    }

    if (elements.moodleLoginFormView) {
      elements.moodleLoginFormView.style.display = isLogged ? 'none' : 'block';
    }
    if (elements.moodleProfileView) {
      elements.moodleProfileView.style.display = isLogged ? 'block' : 'none';
    }
    if (elements.moodleLogoutBtn) {
      elements.moodleLogoutBtn.style.display = isLogged ? 'inline-block' : 'none';
    }

    if (isLogged) {
      if (elements.moodleProfileName) {
        elements.moodleProfileName.textContent = moodleProfile.name || '-';
      }
      if (elements.moodleProfileEmail) {
        elements.moodleProfileEmail.textContent = moodleProfile.email || moodleProfile.username || '-';
      }
      if (elements.moodleProfileCampus) {
        elements.moodleProfileCampus.textContent = moodleProfile.campus || 'IFFluminense';
      }
      if (elements.moodleCourseInput) {
        elements.moodleCourseInput.value = moodleProfile.course || '';
      }
      if (elements.moodleCoursesChips) {
        elements.moodleCoursesChips.innerHTML = '';
        const list = Array.isArray(moodleProfile.courses) ? moodleProfile.courses : [];
        list.slice(0, 6).forEach(courseTitle => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'moodle-course-chip' + (moodleProfile.course === courseTitle ? ' active' : '');
          chip.textContent = courseTitle;
          chip.title = 'Selecionar curso / disciplina';
          chip.addEventListener('click', () => {
            if (elements.moodleCourseInput) {
              elements.moodleCourseInput.value = courseTitle;
            }
            moodleProfile.course = courseTitle;
            persistAiPreferences();
            elements.moodleCoursesChips.querySelectorAll('.moodle-course-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            vscode.postMessage({
              type: 'moodle-update-course',
              payload: { course: courseTitle }
            });
          });
          elements.moodleCoursesChips.appendChild(chip);
        });
      }
    }
  }

  function handleMoodleLoginResult(result) {
    if (moodleLoginTimeoutId) {
      clearTimeout(moodleLoginTimeoutId);
      moodleLoginTimeoutId = null;
    }

    if (elements.moodleLoginSubmitBtn) {
      elements.moodleLoginSubmitBtn.disabled = false;
      elements.moodleLoginSubmitBtn.textContent = 'Entrar com Moodle IFF';
    }

    const isSuccess = Boolean((result?.success || result?.authenticated) && result?.profile);
    if (isSuccess) {
      if (elements.moodlePasswordInput) {
        elements.moodlePasswordInput.value = '';
      }
      if (elements.moodleAuthFeedback) {
        elements.moodleAuthFeedback.textContent = '';
        elements.moodleAuthFeedback.className = 'moodle-feedback-msg';
      }
      renderMoodleSession(result.profile);
    } else if (elements.moodleAuthFeedback) {
      elements.moodleAuthFeedback.textContent =
        result?.message || result?.error || 'Falha ao autenticar no Moodle IFF.';
      elements.moodleAuthFeedback.className = 'moodle-feedback-msg error';
    }
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
      elements.aiModelDropdownContainer?.classList.remove('open');
      elements.dropdownContainer.classList.toggle('open');
    });

    document.addEventListener('click', e => {
      if (elements.dropdownContainer && !elements.dropdownContainer.contains(e.target)) {
        elements.dropdownContainer.classList.remove('open');
      }
      if (elements.aiModelDropdownContainer && !elements.aiModelDropdownContainer.contains(e.target)) {
        elements.aiModelDropdownContainer.classList.remove('open');
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
          model: aiPreferences.model || undefined,
          studentProfile: moodleProfile || undefined
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

      case 'moodle-session-status':
        renderMoodleSession(message.payload?.profile || null);
        break;

      case 'moodle-login-result':
        handleMoodleLoginResult(message.payload);
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
          ? 'Obrigatória pelo servidor'
          : 'Opcional';
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
    } else if (!online && elements.aiModelSyncHint) {
      elements.aiModelSyncHint.textContent = 'Servidor offline';
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
