(() => {
  'use strict';

  const page = document.body;
  const config = {
    unit: page.dataset.unit,
    activityId: page.dataset.activityId,
    caseUrl: page.dataset.caseUrl,
    questionsUrl: page.dataset.questionsUrl,
    totalQuestions: Number(page.dataset.totalQuestions),
    timeMinutes: Number(page.dataset.timeMinutes),
    reactionTypes: Number(page.dataset.reactionTypes),
    storageKey: page.dataset.storageKey
  };

  const typeMeta = {
    opcion_multiple: { label: 'Opción múltiple', icon: 'fa-circle-dot' },
    seleccion_multiple: { label: 'Selección múltiple', icon: 'fa-list-check' },
    clasificar: { label: 'Clasificación', icon: 'fa-layer-group' },
    interpretar_datos: { label: 'Interpretación de datos', icon: 'fa-chart-column' },
    identificar_error: { label: 'Identificación de error', icon: 'fa-triangle-exclamation' },
    ordenar_proceso: { label: 'Ordenar proceso', icon: 'fa-arrow-down-1-9' }
  };

  const attemptCounts = {
    opcion_multiple: 6,
    seleccion_multiple: 3,
    clasificar: 3,
    interpretar_datos: 3,
    identificar_error: 3,
    ordenar_proceso: 2
  };

  let caseData = null;
  let baseQuestions = [];
  let questions = [];
  let currentIndex = 0;
  let answers = new Map();
  let orderState = new Map();
  let touchedOrders = new Set();
  let startedAt = 0;
  let deadline = 0;
  let timerId = null;
  let lastDialogFocus = null;
  let remainingSeconds = 0;
  let hasPausedAttempt = false;
  let attemptActive = false;

  const $ = id => document.getElementById(id);
  const loadingState = $('loadingState');
  const loadError = $('loadError');
  const introScreen = $('introScreen');
  const evaluationScreen = $('evaluationScreen');
  const resultsScreen = $('resultsScreen');
  const questionCard = $('questionCard');

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function shuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function shuffledDifferent(values) {
    const result = shuffle(values);
    const unchanged = result.every((value, index) => value === values[index]);
    if (unchanged && result.length > 1) result.push(result.shift());
    return result;
  }

  function arraysEqualAsSets(left = [], right = []) {
    if (left.length !== right.length) return false;
    const normalizedLeft = [...left].sort();
    const normalizedRight = [...right].sort();
    return normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  function secondsRemaining() {
    if (!attemptActive) return Math.max(0, remainingSeconds);
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }

  function saveAttempt(status = attemptActive ? 'active' : 'paused') {
    if (!config.storageKey || !questions.length || !startedAt) return;
    const savedRemaining = secondsRemaining();
    try {
      sessionStorage.setItem(config.storageKey, JSON.stringify({
        version: 1,
        activityId: config.activityId,
        status,
        questions,
        currentIndex,
        answers: [...answers.entries()],
        orderState: [...orderState.entries()],
        touchedOrders: [...touchedOrders],
        startedAt,
        remainingSeconds: savedRemaining
      }));
    } catch (error) {
      console.warn('[actividad-final] No fue posible guardar el progreso temporal.', error);
    }
  }

  function clearSavedAttempt() {
    try {
      sessionStorage.removeItem(config.storageKey);
    } catch (error) {
      console.warn('[actividad-final] No fue posible limpiar el progreso temporal.', error);
    }
  }

  function showResumeState() {
    hasPausedAttempt = true;
    attemptActive = false;
    evaluationScreen.classList.add('is-hidden');
    resultsScreen.classList.add('is-hidden');
    introScreen.classList.remove('is-hidden');
    document.querySelector('.evaluation-header')?.classList.remove('is-hidden');
    const startPanel = document.querySelector('.start-panel');
    const heading = startPanel?.querySelector('h2');
    const description = startPanel?.querySelector('p');
    if (heading) heading.textContent = 'Tu actividad está pausada.';
    if (description) description.textContent = `Puedes reanudar desde la pregunta ${currentIndex + 1}; el temporizador continuará con el tiempo restante.`;
    $('startEvaluationBtn').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Reanudar actividad';
  }

  function restorePausedAttempt() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(config.storageKey) || 'null');
      if (!saved || saved.activityId !== config.activityId || !Array.isArray(saved.questions) || !saved.questions.length) return false;
      if (!Number.isFinite(Number(saved.remainingSeconds)) || Number(saved.remainingSeconds) <= 0) {
        clearSavedAttempt();
        return false;
      }
      questions = saved.questions;
      currentIndex = Math.min(Math.max(0, Number(saved.currentIndex) || 0), questions.length - 1);
      answers = new Map(saved.answers || []);
      orderState = new Map(saved.orderState || []);
      touchedOrders = new Set(saved.touchedOrders || []);
      startedAt = Number(saved.startedAt) || Date.now();
      remainingSeconds = Number(saved.remainingSeconds);
      showResumeState();
      saveAttempt('paused');
      return true;
    } catch (error) {
      clearSavedAttempt();
      console.warn('[actividad-final] El progreso guardado no era válido y se descartó.', error);
      return false;
    }
  }

  function pauseAttempt() {
    if (!attemptActive || !questions.length) return;
    remainingSeconds = secondsRemaining();
    attemptActive = false;
    clearInterval(timerId);
    saveAttempt('paused');
  }

  function validateData(loadedCase, loadedQuestions) {
    if (!loadedCase || !Array.isArray(loadedCase.sections) || !Array.isArray(loadedCase.resources)) {
      throw new Error('El archivo del caso no contiene las secciones o recursos esperados.');
    }
    if (!Array.isArray(loadedQuestions) || loadedQuestions.length < config.totalQuestions) {
      throw new Error(`El banco debe contener al menos ${config.totalQuestions} preguntas.`);
    }

    const ids = new Set(loadedQuestions.map(question => question.id));
    if (ids.size !== loadedQuestions.length) throw new Error('Los identificadores de las preguntas deben ser únicos.');
    const loadedTypes = new Set(loadedQuestions.map(question => question.type));
    const unknownType = [...loadedTypes].find(type => !typeMeta[type]);
    if (unknownType) throw new Error(`Tipo de reactivo no compatible: ${unknownType}.`);
    if (loadedTypes.size < config.reactionTypes) throw new Error(`El banco debe incluir ${config.reactionTypes} tipos de reactivo.`);

    const resourceIds = new Set(loadedCase.resources.map(resource => resource.id));
    loadedQuestions
      .filter(question => question.resourceId)
      .forEach(question => {
        if (!resourceIds.has(question.resourceId)) {
          throw new Error(`No existe el recurso ${question.resourceId}.`);
        }
      });
  }

  async function loadEvaluation() {
    clearInterval(timerId);
    loadingState.classList.remove('is-hidden');
    loadError.classList.add('is-hidden');
    introScreen.classList.add('is-hidden');
    evaluationScreen.classList.add('is-hidden');
    resultsScreen.classList.add('is-hidden');

    try {
      if (!config.unit || !config.activityId || !config.caseUrl || !config.questionsUrl || !config.storageKey) {
        throw new Error('La configuración declarativa de la actividad está incompleta.');
      }
      const [caseResponse, questionsResponse] = await Promise.all([
        fetch(config.caseUrl),
        fetch(config.questionsUrl)
      ]);
      if (!caseResponse.ok || !questionsResponse.ok) throw new Error('No se pudieron leer los archivos JSON.');

      const [loadedCase, loadedQuestions] = await Promise.all([
        caseResponse.json(),
        questionsResponse.json()
      ]);

      const pendingContent = !loadedCase.title
        && loadedCase.sections.length === 0
        && loadedCase.resources.length === 0
        && Array.isArray(loadedQuestions)
        && loadedQuestions.length === 0;
      if (pendingContent) {
        loadingState.classList.add('is-hidden');
        loadError.classList.remove('error-state');
        loadError.classList.add('content-pending-state');
        loadError.classList.remove('is-hidden');
        loadError.querySelector('i')?.classList.replace('fa-triangle-exclamation', 'fa-file-circle-plus');
        loadError.querySelector('h2').textContent = 'Actividad pendiente de contenido';
        $('loadErrorMessage').textContent = 'La plantilla y los archivos JSON están preparados para incorporar posteriormente el caso y las preguntas de esta unidad.';
        $('retryLoadBtn').classList.add('is-hidden');
        return;
      }
      validateData(loadedCase, loadedQuestions);

      caseData = loadedCase;
      baseQuestions = loadedQuestions;
      renderCaseContent($('casePresentation'), 'case');

      loadingState.classList.add('is-hidden');
      if (!restorePausedAttempt()) introScreen.classList.remove('is-hidden');
    } catch (error) {
      loadingState.classList.add('is-hidden');
      loadError.classList.remove('is-hidden');
      $('loadErrorMessage').textContent = error.message || 'Verifica los archivos de datos e intenta nuevamente.';
      console.error('[actividad-final] No fue posible preparar la actividad.', error);
    }
  }

  function resourceMarkup(resource, compact = false) {
    if (!resource) return '';
    const title = escapeHtml(resource.title);
    const description = escapeHtml(resource.description);

    if (resource.type === 'table') {
      const headings = resource.columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('');
      const rows = resource.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
      return `<section class="resource-card resource-${escapeHtml(resource.id)}" data-resource-id="${escapeHtml(resource.id)}">
        <h3><i class="fas fa-table" aria-hidden="true"></i>${title}</h3>
        <p>${description}</p>
        <div class="table-scroll" tabindex="0" aria-label="Tabla desplazable: ${title}">
          <table class="data-table"><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>
        </div>
      </section>`;
    }

    const maximum = Number(resource.max) || 100;
    const bars = resource.bars.map(bar => {
      const value = Number(bar.value);
      const height = Math.max(2, Math.min(100, (value / maximum) * 100));
      return `<div class="bar-item">
        <span class="bar-value">${escapeHtml(value)}${escapeHtml(resource.unit || '')}</span>
        <div class="bar-column" style="--bar-height:${height}%" aria-hidden="true"></div>
        <span class="bar-label">${escapeHtml(bar.label)}</span>
      </div>`;
    }).join('');
    return `<section class="resource-card resource-${escapeHtml(resource.id)}" data-resource-id="${escapeHtml(resource.id)}">
      <h3><i class="fas fa-chart-column" aria-hidden="true"></i>${title}</h3>
      <p>${description}</p>
      <div class="bar-chart" role="img" aria-label="${title}. ${resource.bars.map(bar => `${bar.label}: ${bar.value}${resource.unit || ''}`).join('. ')}">${bars}</div>
    </section>`;
  }

  function renderCaseContent(target, prefix) {
    if (!target || !caseData) return;
    const section = id => caseData.sections.find(item => item.id === id);
    const sectionMarkup = (item, id = '') => item ? `<article ${id ? `id="${id}"` : ''} class="case-detail">
      <h3><i class="fas ${escapeHtml(item.icon)}" aria-hidden="true"></i>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.content)}</p>
    </article>` : '';

    const summaryOnlyIds = ['contexto', 'objetivo', 'limitaciones'];
    const designSections = caseData.sections
      .filter(item => !summaryOnlyIds.includes(item.id))
      .map(item => sectionMarkup(item))
      .join('');

    const resources = Array.isArray(caseData.resources) ? caseData.resources : [];
    const resourceGroups = [];
    resources.forEach(item => {
      if (item.type === 'table') {
        resourceGroups.push({ kind: 'table', items: [item] });
        return;
      }
      const last = resourceGroups[resourceGroups.length - 1];
      if (last && last.kind === 'chart') last.items.push(item);
      else resourceGroups.push({ kind: 'chart', items: [item] });
    });
    const resultsLayout = resourceGroups.map(group => group.kind === 'table'
      ? `<div class="result-wide">${resourceMarkup(group.items[0])}</div>`
      : `<div class="${group.items.length === 1 ? 'result-wide' : 'result-charts'}">${group.items.map(item => resourceMarkup(item)).join('')}</div>`
    ).join('');

    const resultsMarkup = resources.length ? `
      <section id="${prefix}-results" class="case-content-section case-results-section">
        <div class="case-section-title reading-column"><p class="case-block-label">${escapeHtml(caseData.resultsLabel || 'Resultados')}</p><h3>${escapeHtml(caseData.resultsHeading || 'Datos obtenidos en el estudio')}</h3></div>
        <div id="${prefix}-visuals" class="case-results-layout">${resultsLayout}</div>
        ${caseData.resultsNarrative ? `<div class="case-results-narrative"><div class="reading-column"><strong>${escapeHtml(caseData.resultsNarrativeLabel || 'Descripción general de los hallazgos')}</strong><p>${escapeHtml(caseData.resultsNarrative)}</p></div></div>` : ''}
      </section>` : '';

    target.innerHTML = `
      <section id="${prefix}-summary" class="case-content-section case-general-section">
        <div class="reading-column">
          <p class="case-block-label">Información general</p>
          <h3 class="case-main-title">${escapeHtml(caseData.title)}</h3>
        </div>
        <div class="case-general-copy">
          <article class="case-detail case-summary"><h3><i class="fas fa-file-lines" aria-hidden="true"></i>Resumen del caso</h3><p>${escapeHtml(caseData.summary)}</p></article>
          ${sectionMarkup(section('contexto'))}
          ${sectionMarkup(section('objetivo'))}
        </div>
      </section>
      <section id="${prefix}-procedure" class="case-content-section case-design-section">
        <div class="case-section-title reading-column"><p class="case-block-label">Diseño y procedimiento</p><h3>Cómo se realizó la investigación</h3></div>
        <div class="case-design-grid">${designSections}${sectionMarkup(section('limitaciones'), `${prefix}-limitations`)}</div>
      </section>
      ${resultsMarkup}`;
  }

  function prepareAttempt() {
    answers = new Map();
    orderState = new Map();
    touchedOrders = new Set();
    currentIndex = 0;
    let selectedQuestions = Object.entries(attemptCounts).flatMap(([type, total]) =>
      shuffle(baseQuestions.filter(question => question.type === type)).slice(0, total)
    );
    const selectedIds = new Set(selectedQuestions.map(question => question.id));
    if (selectedQuestions.length < config.totalQuestions) {
      selectedQuestions = selectedQuestions.concat(
        shuffle(baseQuestions.filter(question => !selectedIds.has(question.id)))
          .slice(0, config.totalQuestions - selectedQuestions.length)
      );
    }
    questions = shuffle(selectedQuestions).slice(0, config.totalQuestions).map(question => {
      const prepared = { ...question };
      if (Array.isArray(question.options)) prepared.displayOptions = shuffle(question.options);
      if (question.type === 'clasificar') prepared.displayItems = shuffle(question.items);
      if (question.type === 'ordenar_proceso') {
        const segments = shuffledDifferent(question.segments);
        prepared.displaySegments = segments;
        orderState.set(question.id, [...segments]);
      }
      return prepared;
    });
  }

  function startEvaluation() {
    if (!hasPausedAttempt) {
      prepareAttempt();
      startedAt = Date.now();
      remainingSeconds = config.timeMinutes * 60;
    }
    document.querySelector('.evaluation-header')?.classList.add('is-hidden');
    introScreen.classList.add('is-hidden');
    resultsScreen.classList.add('is-hidden');
    evaluationScreen.classList.remove('is-hidden');
    deadline = Date.now() + remainingSeconds * 1000;
    attemptActive = true;
    hasPausedAttempt = false;
    document.querySelector('.question-progress')?.setAttribute('aria-valuemax', String(questions.length));
    startTimer();
    renderQuestion();
    saveAttempt('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startTimer() {
    clearInterval(timerId);
    updateTimer();
    timerId = window.setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    remainingSeconds = remaining;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    $('timerValue').textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    if (remaining <= 0) {
      clearInterval(timerId);
      closePendingDialog();
      submitEvaluation(true);
    }
  }

  function currentQuestion() {
    return questions[currentIndex];
  }

  function questionHeading(question) {
    return escapeHtml(question.question || question.instruction || 'Clasifica los elementos.');
  }

  function singleChoiceMarkup(question) {
    const selected = answers.get(question.id) || '';
    return `<div class="options-list">${question.displayOptions.map((option, index) => {
      const checked = selected === option;
      return `<label class="option-label${checked ? ' is-selected' : ''}">
        <input type="radio" name="question-${question.id}" value="${escapeHtml(option)}" ${checked ? 'checked' : ''}>
        <span>${escapeHtml(option)}</span>
      </label>`;
    }).join('')}</div>`;
  }

  function multipleChoiceMarkup(question) {
    const selected = answers.get(question.id) || [];
    return `<div class="options-list">${question.displayOptions.map(option => {
      const checked = selected.includes(option);
      return `<label class="option-label${checked ? ' is-selected' : ''}">
        <input type="checkbox" name="question-${question.id}" value="${escapeHtml(option)}" ${checked ? 'checked' : ''}>
        <span>${escapeHtml(option)}</span>
      </label>`;
    }).join('')}</div>`;
  }

  function classificationMarkup(question) {
    const selected = answers.get(question.id) || {};
    const options = question.categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    return `<div class="classification-list">${question.displayItems.map(item => `
      <label class="classification-item">
        <span>${escapeHtml(item.text)}</span>
        <select class="classification-select" data-item="${escapeHtml(item.text)}" aria-label="Clasificar: ${escapeHtml(item.text)}">
          <option value="">Selecciona una categoría</option>
          ${options.replace(`value="${escapeHtml(selected[item.text])}"`, `value="${escapeHtml(selected[item.text])}" selected`)}
        </select>
      </label>`).join('')}</div>`;
  }

  function orderingMarkup(question) {
    const segments = orderState.get(question.id) || question.displaySegments;
    return `<div class="ordering-list">${segments.map((segment, index) => `
      <div class="order-item" draggable="true" data-order-index="${index}">
        <span class="order-number">${index + 1}</span>
        <span>${escapeHtml(segment)}</span>
        <span class="order-actions">
          <button class="order-button" type="button" data-order-action="up" data-order-index="${index}" aria-label="Subir: ${escapeHtml(segment)}" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up" aria-hidden="true"></i></button>
          <button class="order-button" type="button" data-order-action="down" data-order-index="${index}" aria-label="Bajar: ${escapeHtml(segment)}" ${index === segments.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down" aria-hidden="true"></i></button>
        </span>
      </div>`).join('')}</div>`;
  }

  function renderQuestion() {
    const question = currentQuestion();
    if (!question) return;
    questionCard.dataset.questionId = String(question.id);
    const meta = typeMeta[question.type];
    const instruction = question.instruction && question.instruction !== question.question
      ? `<p class="question-instruction">${escapeHtml(question.instruction)}</p>` : '';
    const scenario = question.scenario ? `<div class="scenario-box"><strong>Situación:</strong> ${escapeHtml(question.scenario)}</div>` : '';
    const resource = question.resourceId
      ? `<div class="question-resource">${resourceMarkup(caseData.resources.find(item => item.id === question.resourceId), true)}</div>` : '';

    let interaction = '';
    if (['opcion_multiple', 'interpretar_datos', 'identificar_error'].includes(question.type)) interaction = singleChoiceMarkup(question);
    if (question.type === 'seleccion_multiple') interaction = multipleChoiceMarkup(question);
    if (question.type === 'clasificar') interaction = classificationMarkup(question);
    if (question.type === 'ordenar_proceso') interaction = orderingMarkup(question);

    questionCard.innerHTML = `
      <div class="question-card-heading">
        <span class="question-number-icon" aria-hidden="true"><i class="fas ${meta.icon}"></i></span>
        <div><strong>Pregunta ${currentIndex + 1}</strong><span class="question-type">${meta.label}</span></div>
      </div>
      ${scenario}
      <h3>${questionHeading(question)}</h3>
      ${instruction}
      ${resource}
      ${interaction}`;

    updateEvaluationProgress();
    updateNavigation();
  }

  function isAnswered(question) {
    const answer = answers.get(question.id);
    if (['opcion_multiple', 'interpretar_datos', 'identificar_error'].includes(question.type)) return Boolean(answer);
    if (question.type === 'seleccion_multiple') return Array.isArray(answer) && answer.length > 0;
    if (question.type === 'clasificar') return question.items.every(item => Boolean(answer?.[item.text]));
    if (question.type === 'ordenar_proceso') return touchedOrders.has(question.id);
    return false;
  }

  function updateEvaluationProgress() {
    const answered = questions.filter(isAnswered).length;
    $('questionCounter').textContent = `Pregunta ${currentIndex + 1} de ${questions.length}`;
    $('answeredCounter').textContent = `${answered} ${answered === 1 ? 'respondida' : 'respondidas'}`;
    const progress = (answered / questions.length) * 100;
    $('questionProgressBar').style.width = `${progress}%`;
    const progressElement = document.querySelector('.question-progress');
    progressElement?.setAttribute('aria-valuenow', String(answered));
  }

  function updateNavigation() {
    $('previousQuestionBtn').disabled = currentIndex === 0;
    const onLast = currentIndex === questions.length - 1;
    $('nextQuestionBtn').classList.toggle('is-hidden', onLast);
    $('evaluateFinalBtn').classList.toggle('is-hidden', !onLast);
    $('questionDots').innerHTML = questions.map((question, index) => `<button type="button" class="question-dot${index === currentIndex ? ' is-current' : ''}${isAnswered(question) ? ' is-answered' : ''}" data-question-index="${index}" aria-label="Ir a la pregunta ${index + 1}" ${index === currentIndex ? 'aria-current="step"' : ''}>${index + 1}</button>`).join('');
  }

  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    renderQuestion();
    saveAttempt('active');
    questionCard.focus?.({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, questionCard.offsetTop - 90), behavior: 'smooth' });
  }

  function handleQuestionChange(event) {
    const question = currentQuestion();
    if (!question) return;

    if (event.target.matches('input[type="radio"]')) {
      answers.set(question.id, event.target.value);
      questionCard.querySelectorAll('.option-label').forEach(label => label.classList.toggle('is-selected', label.querySelector('input')?.checked));
    }

    if (event.target.matches('input[type="checkbox"]')) {
      const selected = [...questionCard.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
      answers.set(question.id, selected);
      questionCard.querySelectorAll('.option-label').forEach(label => label.classList.toggle('is-selected', label.querySelector('input')?.checked));
    }

    if (event.target.matches('.classification-select')) {
      const selected = { ...(answers.get(question.id) || {}) };
      if (event.target.value) selected[event.target.dataset.item] = event.target.value;
      else delete selected[event.target.dataset.item];
      answers.set(question.id, selected);
    }

    updateEvaluationProgress();
    updateNavigation();
    saveAttempt('active');
  }

  function handleQuestionClick(event) {
    const button = event.target.closest('[data-order-action]');
    if (!button) return;
    const question = currentQuestion();
    const segments = [...(orderState.get(question.id) || [])];
    const index = Number(button.dataset.orderIndex);
    const targetIndex = button.dataset.orderAction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= segments.length) return;
    [segments[index], segments[targetIndex]] = [segments[targetIndex], segments[index]];
    orderState.set(question.id, segments);
    answers.set(question.id, [...segments]);
    touchedOrders.add(question.id);
    renderQuestion();
    saveAttempt('active');
  }

  let draggedOrderIndex = null;

  function handleOrderDragStart(event) {
    const item = event.target.closest('.order-item');
    if (!item) return;
    draggedOrderIndex = Number(item.dataset.orderIndex);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleOrderDrop(event) {
    const item = event.target.closest('.order-item');
    if (!item || draggedOrderIndex === null) return;
    event.preventDefault();
    const question = currentQuestion();
    const targetIndex = Number(item.dataset.orderIndex);
    const segments = [...(orderState.get(question.id) || [])];
    const [moved] = segments.splice(draggedOrderIndex, 1);
    segments.splice(targetIndex, 0, moved);
    orderState.set(question.id, segments);
    answers.set(question.id, [...segments]);
    touchedOrders.add(question.id);
    draggedOrderIndex = null;
    renderQuestion();
    saveAttempt('active');
  }

  function openCaseDrawer() {
    lastDialogFocus = document.activeElement;
    if ($('casePresentation').parentElement !== $('caseDrawerContent')) {
      $('caseDrawerContent').appendChild($('casePresentation'));
    }
    $('caseDrawerOverlay').classList.remove('is-hidden');
    $('caseDrawerOverlay').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    $('caseDrawer').focus();
  }

  function closeCaseDrawer() {
    $('caseDrawerOverlay').classList.add('is-hidden');
    $('caseDrawerOverlay').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastDialogFocus?.focus?.();
    lastDialogFocus = null;
  }

  function openPendingDialog() {
    const pending = questions.filter(question => !isAnswered(question)).length;
    lastDialogFocus = document.activeElement;
    $('pendingDialogText').textContent = `Faltan ${pending} ${pending === 1 ? 'pregunta' : 'preguntas'}. Si entregas ahora, se contarán como incorrectas.`;
    $('pendingDialog').classList.remove('is-hidden');
    $('pendingDialog').setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    $('continueEvaluationBtn').focus();
  }

  function closePendingDialog() {
    $('pendingDialog').classList.add('is-hidden');
    $('pendingDialog').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastDialogFocus?.focus?.();
    lastDialogFocus = null;
  }

  function isCorrect(question) {
    const answer = answers.get(question.id);
    if (!isAnswered(question)) return false;
    if (['opcion_multiple', 'interpretar_datos', 'identificar_error'].includes(question.type)) return answer === question.answer;
    if (question.type === 'seleccion_multiple') return arraysEqualAsSets(answer, question.answer);
    if (question.type === 'clasificar') return question.items.every(item => answer[item.text] === item.category);
    if (question.type === 'ordenar_proceso') return answer.every((segment, index) => segment === question.answer[index]);
    return false;
  }

  function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  function formatAnswer(question, answer, correct = false) {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return 'Sin respuesta';
    if (question.type === 'clasificar') {
      const source = correct ? Object.fromEntries(question.items.map(item => [item.text, item.category])) : answer;
      return question.items.map(item => `${item.text} → ${source?.[item.text] || 'Sin clasificar'}`).join(' | ');
    }
    if (Array.isArray(answer)) return answer.join(' → ');
    return String(answer);
  }

  function correctAnswerFor(question) {
    if (question.type === 'clasificar') return Object.fromEntries(question.items.map(item => [item.text, item.category]));
    return question.answer;
  }

  function submitEvaluation(timeExpired = false) {
    clearInterval(timerId);
    attemptActive = false;
    hasPausedAttempt = false;
    clearSavedAttempt();
    closePendingDialog();
    closeCaseDrawer();
    const elapsedSeconds = Math.max(0, (config.timeMinutes * 60) - secondsRemaining());
    const correct = questions.filter(isCorrect).length;
    const unanswered = questions.filter(question => !isAnswered(question)).length;
    const incorrect = questions.length - correct - unanswered;
    const percentage = (correct / questions.length) * 100;
    const grade = percentage / 10;

    evaluationScreen.classList.add('is-hidden');
    resultsScreen.classList.remove('is-hidden');
    $('gradeValue').textContent = grade.toFixed(1);
    $('resultsMessage').textContent = timeExpired
      ? 'El tiempo terminó. Revisa cada respuesta y utiliza la retroalimentación para fortalecer tu análisis.'
      : 'Compara tus decisiones con la evidencia del caso y revisa la explicación de cada reactivo.';

    const summary = [
      ['Correctas', correct],
      ['Incorrectas', incorrect],
      ['Sin responder', unanswered],
      ['Porcentaje', `${percentage.toFixed(1)} %`],
      ['Tiempo utilizado', formatDuration(elapsedSeconds)]
    ];
    $('resultsSummary').innerHTML = summary.map(([label, value]) => `<div class="summary-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('');

    const performanceCategories = [...new Set(questions.map(question => question.category).filter(Boolean))];
    $('categoryPerformance').innerHTML = performanceCategories.map(category => {
      const categoryQuestions = questions.filter(question => question.category === category);
      const categoryCorrect = categoryQuestions.filter(isCorrect).length;
      const categoryPercentage = categoryQuestions.length ? (categoryCorrect / categoryQuestions.length) * 100 : 0;
      return `<div class="category-row">
        <strong>${escapeHtml(category)}</strong>
        <div class="category-track" role="progressbar" aria-label="${escapeHtml(category)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${categoryPercentage.toFixed(0)}"><div style="width:${categoryPercentage}%"></div></div>
        <span>${categoryCorrect}/${categoryQuestions.length}</span>
      </div>`;
    }).join('');

    $('questionReview').innerHTML = questions.map((question, index) => {
      const correctQuestion = isCorrect(question);
      const answer = answers.get(question.id);
      const visualResource = question.resourceId
        ? `<div class="question-resource">${resourceMarkup(caseData.resources.find(resource => resource.id === question.resourceId), true)}</div>` : '';
      return `<details class="review-item">
        <summary><span class="review-status ${correctQuestion ? 'correct' : 'incorrect'}"><i class="fas ${correctQuestion ? 'fa-check' : 'fa-times'}" aria-hidden="true"></i></span><span>Pregunta ${index + 1}: ${questionHeading(question)}</span></summary>
        <div class="review-detail">
          <div class="answer-comparison">
            <div class="answer-box"><span>Tu respuesta</span>${escapeHtml(formatAnswer(question, answer))}</div>
            <div class="answer-box"><span>Respuesta correcta</span>${escapeHtml(formatAnswer(question, correctAnswerFor(question), true))}</div>
          </div>
          <p class="review-explanation"><strong>Explicación:</strong> ${escapeHtml(question.explanation)}</p>
          ${visualResource}
        </div>
      </details>`;
    }).join('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function requestEvaluation() {
    const pending = questions.filter(question => !isAnswered(question)).length;
    if (pending > 0) openPendingDialog();
    else submitEvaluation(false);
  }

  function returnToCase() {
    clearInterval(timerId);
    clearSavedAttempt();
    attemptActive = false;
    hasPausedAttempt = false;
    answers = new Map();
    orderState = new Map();
    touchedOrders = new Set();
    questions = [];
    currentIndex = 0;
    remainingSeconds = config.timeMinutes * 60;
    $('timerValue').textContent = `${config.timeMinutes}:00`;
    $('startEvaluationBtn').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Iniciar actividad';
    const startPanel = document.querySelector('.start-panel');
    const heading = startPanel?.querySelector('h2');
    const description = startPanel?.querySelector('p');
    if (heading) heading.textContent = 'Cuando hayas revisado el caso, inicia la actividad.';
    if (description) description.textContent = 'Durante el intento podrás consultar nuevamente toda la información sin perder tus respuestas.';
    resultsScreen.classList.add('is-hidden');
    evaluationScreen.classList.add('is-hidden');
    document.querySelector('.case-card')?.appendChild($('casePresentation'));
    introScreen.classList.remove('is-hidden');
    document.querySelector('.evaluation-header')?.classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleGlobalKeydown(event) {
    if (event.key !== 'Escape') return;
    if (!$('pendingDialog').classList.contains('is-hidden')) closePendingDialog();
    else if (!$('caseDrawerOverlay').classList.contains('is-hidden')) closeCaseDrawer();
    else if ($('sidebarNav').classList.contains('open')) closeSidebar();
  }

  function setSidebarState(isOpen, restoreFocus = false) {
    const menuToggle = $('menuToggle');
    const sidebar = $('sidebarNav');
    const overlay = $('sidebarOverlay');
    sidebar.classList.toggle('open', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.classList.toggle('sidebar-open', isOpen);
    sidebar.setAttribute('aria-hidden', String(!isOpen));
    overlay.setAttribute('aria-hidden', String(!isOpen));
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    menuToggle.querySelector('i')?.classList.toggle('fa-bars', !isOpen);
    menuToggle.querySelector('i')?.classList.toggle('fa-xmark', isOpen);
    if (isOpen) sidebar.querySelector('a')?.focus();
    else if (restoreFocus) menuToggle.focus();
  }

  function closeSidebar(restoreFocus = true) {
    setSidebarState(false, restoreFocus);
  }

  function updatePageControls() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    $('readingProgressBar').style.width = `${Math.min(100, (scrollTop / scrollable) * 100)}%`;
    $('scrollToTop').classList.toggle('show', scrollTop > 420);
  }

  questionCard.addEventListener('change', handleQuestionChange);
  questionCard.addEventListener('click', handleQuestionClick);
  questionCard.addEventListener('dragstart', handleOrderDragStart);
  questionCard.addEventListener('dragover', event => {
    if (event.target.closest('.order-item')) event.preventDefault();
  });
  questionCard.addEventListener('drop', handleOrderDrop);
  $('questionDots').addEventListener('click', event => {
    const button = event.target.closest('[data-question-index]');
    if (button) goToQuestion(Number(button.dataset.questionIndex));
  });
  $('previousQuestionBtn').addEventListener('click', () => goToQuestion(currentIndex - 1));
  $('nextQuestionBtn').addEventListener('click', () => goToQuestion(currentIndex + 1));
  $('evaluateFinalBtn').addEventListener('click', requestEvaluation);
  $('startEvaluationBtn').addEventListener('click', startEvaluation);
  $('retryEvaluationBtn').addEventListener('click', returnToCase);
  $('consultCaseBtn').addEventListener('click', openCaseDrawer);
  $('closeCaseDrawerBtn').addEventListener('click', closeCaseDrawer);
  $('caseDrawerOverlay').addEventListener('click', event => {
    if (event.target === $('caseDrawerOverlay')) closeCaseDrawer();
  });
  document.querySelector('.drawer-tabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-case-target]');
    if (!button) return;
    document.getElementById(button.dataset.caseTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('continueEvaluationBtn').addEventListener('click', closePendingDialog);
  $('confirmSubmitBtn').addEventListener('click', () => submitEvaluation(false));
  $('retryLoadBtn').addEventListener('click', loadEvaluation);
  $('menuToggle').addEventListener('click', () => {
    setSidebarState(!$('sidebarNav').classList.contains('open'));
  });
  $('sidebarOverlay').addEventListener('click', () => closeSidebar());
  $('sidebarNav').addEventListener('click', event => {
    if (event.target.closest('a')) closeSidebar(false);
  });
  $('scrollToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', updatePageControls, { passive: true });
  window.addEventListener('resize', updatePageControls);
  window.addEventListener('pagehide', pauseAttempt);
  window.addEventListener('pageshow', event => {
    if (event.persisted && questions.length && !resultsScreen.classList.contains('is-hidden')) return;
    if (event.persisted && questions.length) showResumeState();
  });
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('DOMContentLoaded', () => {
    updatePageControls();
    loadEvaluation();
  });
})();
