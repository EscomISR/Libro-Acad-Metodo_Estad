let time = 0;
  const defaultQuestionCount = 20;
  let feedbackRules = [];
  let gameOver = false;
  let timerInterval;
  let sidebarOpen = false;
  let selectedAnswers = {};
  let completed = 0;
  let questions = [];
  let correctCount = 0;
  let timeLimit = 0;
  let timeRemaining = 0;
  let activityStarted = false;
  let questionsReady = false;
  const secondsPerQuestion = 30;

  function getActivityTimeLimit(questionCount) {
    const configuredTimeLimit = Number.parseInt(document.body.dataset.timeLimitSeconds || '', 10);
    return Number.isFinite(configuredTimeLimit) && configuredTimeLimit > 0
      ? configuredTimeLimit
      : questionCount * secondsPerQuestion;
  }

  const activityStories = {
    'actividad_1_1': {
      title: 'Actividad de aprendizaje 1.1',
      headerSubtitle: 'Metodología de la investigación científica',
      subtitle: 'El Dr. Salas debe iniciar un estudio científico y necesita definir con claridad el método que guiará su trabajo.',
      avatar: '🧑‍⚕️',
      caseName: 'Actividad 1.1 - Métodos de la investigación científica',
      mission: 'Ayuda al Dr. Salas a reconocer los métodos generales y particulares de la ciencia para orientar su investigación.',
      victory: 'Responde correctamente las preguntas para que el Dr. Salas pueda justificar una investigación sólida.',
      strategy: 'Lee cuidadosamente cada pregunta basada en el tema 1.1. Demuestra tu conocimiento metodológico.',
      feedback: {
        low: 'El Dr. Salas no logró sustentar bien su investigación. Vuelve a repasar los métodos de investigación e inténtalo de nuevo.',
        mid: 'El Dr. Salas avanzó, pero su protocolo todavía necesita bases metodológicas más claras.',
        high: 'El Dr. Salas recibió buenos comentarios por la claridad de su enfoque metodológico.',
        perfect: 'El Dr. Salas recibió reconocimiento por plantear una investigación impecable desde el método.'
      }
    },
    'actividad_1_2': {
      title: 'Caso de investigación: ordenar el proceso',
      subtitle: 'El Dr. Méndez tiene datos e ideas, pero necesita organizar las etapas de su investigación antes de continuar.',
      avatar: '🧑‍🔬',
      caseName: 'Proceso del Dr. Méndez',
      mission: 'Ayuda al Dr. Méndez a identificar el orden y la función de las etapas del proceso de investigación.',
      victory: 'Responde correctamente para que el proyecto avance desde el planteamiento hasta las conclusiones.',
      strategy: 'Analiza cada etapa aprendida: observación, antecedentes, objetivos, diseño, recolección, análisis y conclusiones.',
      feedback: {
        low: 'El proyecto del Dr. Méndez quedó desordenado. Repasa las etapas del proceso e inténtalo de nuevo.',
        mid: 'El Dr. Méndez logró avanzar, pero debe reforzar algunas etapas antes de entregar su plan.',
        high: 'El Dr. Méndez estructuró bien su proceso de investigación y recibió una revisión favorable.',
        perfect: 'El Dr. Méndez presentó un proceso impecable y su proyecto fue aprobado sin observaciones.'
      }
    },
    'actividad_1_3': {
      title: 'Caso de investigación: elegir el diseño',
      subtitle: 'La Dra. Robles necesita seleccionar el enfoque y tipo de investigación más adecuados para su problema.',
      avatar: '🧑‍🏫',
      caseName: 'Diseño de la Dra. Robles',
      mission: 'Ayuda a la Dra. Robles a diferenciar enfoques, diseños y alcances de investigación.',
      victory: 'Responde correctamente para que la investigación use un diseño coherente con sus objetivos.',
      strategy: 'Recuerda las diferencias entre cualitativo, cuantitativo, experimental, descriptivo, transversal y longitudinal.',
      feedback: {
        low: 'La Dra. Robles eligió un diseño poco adecuado. Repasa los tipos de investigación e inténtalo de nuevo.',
        mid: 'La Dra. Robles identificó parte del diseño, pero todavía necesita afinar el enfoque.',
        high: 'La Dra. Robles seleccionó un diseño consistente y recibió buenos comentarios.',
        perfect: 'La Dra. Robles defendió un diseño excelente y su investigación quedó muy bien fundamentada.'
      }
    },
    'actividad_1_4': {
      title: 'Caso de investigación: plantear el problema',
      subtitle: 'El Dr. Herrera detectó un suceso relevante y necesita transformarlo en un problema de investigación claro.',
      avatar: '🧑‍💼',
      caseName: 'Planeación del Dr. Herrera',
      mission: 'Ayuda al Dr. Herrera a reconocer los elementos necesarios para planear su investigación.',
      victory: 'Responde correctamente para que el planteamiento del problema quede claro y defendible.',
      strategy: 'Recuerda los elementos del planteamiento del problema, justificación, objetivos y metodología.',
      feedback: {
        low: 'El Dr. Herrera no logró formular un problema claro. Repasa la planeación e inténtalo de nuevo.',
        mid: 'El Dr. Herrera tiene una base útil, pero debe mejorar la precisión del planteamiento.',
        high: 'El Dr. Herrera presentó una planeación clara y recibió felicitaciones por su avance.',
        perfect: 'El Dr. Herrera formuló un planteamiento excelente y su investigación fue aprobada con distinción.'
      }
    },
    'actividad_2_1': {
      title: 'Caso de investigación: construir el protocolo',
      subtitle: 'La Dra. Luna necesita integrar marco teórico, variables, hipótesis y justificación en un protocolo coherente.',
      avatar: '📋',
      caseName: 'Protocolo de la Dra. Luna',
      mission: 'Ayuda a la Dra. Luna a reconocer los apartados esenciales de un protocolo de investigación.',
      victory: 'Responde correctamente para que el protocolo tenga estructura, fundamento y claridad.',
      strategy: 'Recuerda los tipos de variables, las características de los objetivos y el propósito del marco teórico.',
      feedback: {
        low: 'El protocolo de la Dra. Luna quedó incompleto. Repasa su estructura e inténtalo de nuevo.',
        mid: 'La Dra. Luna avanzó, pero debe fortalecer algunos apartados del protocolo.',
        high: 'La Dra. Luna entregó un protocolo sólido y recibió una revisión positiva.',
        perfect: 'La Dra. Luna presentó un protocolo excelente y fue reconocido por su calidad metodológica.'
      }
    },
    'actividad_2_2': {
      title: 'Caso de investigación: diseñar la muestra',
      subtitle: 'El Dr. Navarro debe operacionalizar variables, elegir muestra y preparar su plan estadístico.',
      avatar: '📐',
      caseName: 'Diseño del Dr. Navarro',
      mission: 'Ayuda al Dr. Navarro a tomar decisiones correctas sobre variables, muestra y plan estadístico.',
      victory: 'Responde correctamente para que el diseño de investigación sea viable y ordenado.',
      strategy: 'Recuerda los tipos de muestreo y el concepto de operacionalización de variables.',
      feedback: {
        low: 'El diseño del Dr. Navarro quedó débil. Repasa variables, muestra y plan estadístico e inténtalo de nuevo.',
        mid: 'El Dr. Navarro puede avanzar, pero necesita ajustar decisiones importantes del diseño.',
        high: 'El Dr. Navarro diseñó una investigación clara y recibió buenos comentarios.',
        perfect: 'El Dr. Navarro presentó un diseño excelente y su plan fue aprobado sin observaciones.'
      }
    },
    'actividad_2_3': {
      title: 'Caso de investigación: documentar fuentes',
      subtitle: 'La Dra. Ibarra debe sustentar su investigación con referencias confiables y bien seleccionadas.',
      avatar: '📚',
      caseName: 'Búsqueda documental de la Dra. Ibarra',
      mission: 'Ayuda a la Dra. Ibarra a identificar fuentes, referencias y criterios de búsqueda documental.',
      victory: 'Responde correctamente para que su investigación quede respaldada por evidencia confiable.',
      strategy: 'Recuerda la importancia de bases de datos, gestores bibliográficos y citas académicas.',
      feedback: {
        low: 'La Dra. Ibarra usó fuentes insuficientes. Repasa investigación documental e inténtalo de nuevo.',
        mid: 'La Dra. Ibarra encontró algunas fuentes útiles, pero debe mejorar la selección y citación.',
        high: 'La Dra. Ibarra documentó bien su trabajo y recibió una evaluación favorable.',
        perfect: 'La Dra. Ibarra construyó una base documental excelente y su investigación ganó mucha solidez.'
      }
    },
    'actividad_3_1': {
      title: 'Caso de investigación: preparar el informe final',
      subtitle: 'El Dr. Ortega terminó la recolección de datos y necesita presentar resultados de forma clara.',
      avatar: '📊',
      caseName: 'Informe del Dr. Ortega',
      mission: 'Ayuda al Dr. Ortega a reconocer elementos clave del informe final y la ejecución de la investigación.',
      victory: 'Responde correctamente para que el informe final comunique adecuadamente los resultados.',
      strategy: 'Recuerda las características de presentación, ejecución y aplicación de instrumentos.',
      feedback: {
        low: 'El informe del Dr. Ortega quedó confuso. Repasa la estructura del informe e inténtalo de nuevo.',
        mid: 'El Dr. Ortega presentó avances, pero debe mejorar la claridad del informe.',
        high: 'El Dr. Ortega entregó un buen informe y recibió felicitaciones por su trabajo.',
        perfect: 'El Dr. Ortega presentó un informe excelente y fue reconocido por la calidad de sus resultados.'
      }
    },
    'actividad_3_2': {
      title: 'Caso de investigación: procesar los datos',
      subtitle: 'La Dra. Serrano tiene información recolectada y necesita organizarla antes del análisis estadístico.',
      avatar: '🧮',
      caseName: 'Datos de la Dra. Serrano',
      mission: 'Ayuda a la Dra. Serrano a distinguir recopilación, procesamiento y organización de datos.',
      victory: 'Responde correctamente para que los datos queden listos para un análisis confiable.',
      strategy: 'Recuerda depuración, codificación, tabulación y análisis estadístico de datos.',
      feedback: {
        low: 'Los datos de la Dra. Serrano quedaron desordenados. Repasa procesamiento de datos e inténtalo de nuevo.',
        mid: 'La Dra. Serrano organizó parte de la información, pero debe reforzar el procesamiento.',
        high: 'La Dra. Serrano procesó bien los datos y pudo continuar con su análisis.',
        perfect: 'La Dra. Serrano preparó una base de datos excelente y su análisis avanzó sin problemas.'
      }
    },
    'actividad_3_3': {
      title: 'Caso de investigación: interpretar la estadística',
      subtitle: 'El Dr. Paredes necesita convertir tablas, frecuencias y gráficos en información útil para su estudio.',
      avatar: '📈',
      caseName: 'Análisis del Dr. Paredes',
      mission: 'Ayuda al Dr. Paredes a interpretar frecuencias, porcentajes, gráficos y tablas de contingencia.',
      victory: 'Responde correctamente para que los resultados estadísticos se comuniquen con precisión.',
      strategy: 'Recuerda frecuencias, porcentajes, proporciones, tasas, tablas y gráficos.',
      feedback: {
        low: 'El Dr. Paredes interpretó mal los datos. Repasa estadística descriptiva e inténtalo de nuevo.',
        mid: 'El Dr. Paredes obtuvo parte del análisis, pero debe reforzar la interpretación.',
        high: 'El Dr. Paredes interpretó bien los resultados y recibió buenos comentarios.',
        perfect: 'El Dr. Paredes presentó un análisis estadístico excelente y fue reconocido por su claridad.'
      }
    },
    'actividad_3_4': {
      title: 'Caso de investigación: defender conclusiones',
      subtitle: 'La Dra. Torres debe discutir sus resultados y formular conclusiones bien fundamentadas.',
      avatar: '🎓',
      caseName: 'Conclusiones de la Dra. Torres',
      mission: 'Ayuda a la Dra. Torres a interpretar resultados, discutir hallazgos y formular conclusiones.',
      victory: 'Responde correctamente para que sus conclusiones sean claras, prudentes y defendibles.',
      strategy: 'Recuerda cómo contrastar resultados con el marco teórico y formular conclusiones fundamentadas.',
      feedback: {
        low: 'Las conclusiones de la Dra. Torres quedaron poco sustentadas. Repasa interpretación y discusión e inténtalo de nuevo.',
        mid: 'La Dra. Torres planteó conclusiones útiles, pero debe fortalecer la discusión.',
        high: 'La Dra. Torres defendió bien sus resultados y recibió felicitaciones.',
        perfect: 'La Dra. Torres presentó conclusiones excelentes y recibió reconocimiento por su investigación.'
      }
    }
  };

  function getActivityKey() {
    const file = window.location.pathname.split('/').pop() || '';
    return file.replace('.html', '');
  }

  function getCurrentStory() {
    return activityStories[getActivityKey()] ?? activityStories.actividad_1_1;
  }

  function applyActivityStory() {
    const story = getCurrentStory();
    const headerTitle = document.querySelector('.header h1');
    const subtitle = document.querySelector('.header .subtitle');
    const instructionsTitle = document.querySelector('.instructions h2');
    const instructionsList = document.querySelector('.instructions ul');
    const instructionsText = document.querySelector('.instructions p');
    const avatar = document.getElementById('caseAvatar');
    const caseName = document.querySelector('.case-name');
    const evaluateBtn = document.getElementById('evaluateBtn');

    if (headerTitle) headerTitle.textContent = story.title;
    if (subtitle) subtitle.textContent = story.headerSubtitle || story.subtitle;
    if (instructionsTitle) instructionsTitle.innerHTML = '<i class="fas fa-list-check"></i> Indicaciones de la actividad';
    if (instructionsText) {
      instructionsText.textContent = 'Lee cuidadosamente cada pregunta y responde según el tipo de ejercicio indicado. En esta actividad encontrarás preguntas de opción múltiple, completar oraciones, verdadero o falso y ordenar palabras. Selecciona la respuesta correcta o acomoda los elementos según corresponda. Antes de avanzar, revisa que tu respuesta tenga sentido con el tema visto en la unidad.';
    }
    if (instructionsList) {
      instructionsList.innerHTML = `
        <li><strong>Opción múltiple:</strong> elige una sola respuesta correcta.</li>
        <li><strong>Completar oración:</strong> selecciona las palabras que completan correctamente el enunciado.</li>
        <li><strong>Verdadero o falso:</strong> indica si la afirmación es correcta o incorrecta.</li>
        <li><strong>Ordenar oración:</strong> acomoda las palabras para formar una oración coherente.</li>
      `;
    }
    if (avatar) avatar.innerHTML = '<i class="fas fa-clipboard-list"></i>';
    if (caseName) caseName.textContent = 'Preguntas de evaluación';
    if (evaluateBtn) evaluateBtn.innerHTML = '<i class="fas fa-check-circle"></i> Evaluar respuestas';
  }

  async function initGame() {
    const container = document.getElementById('questionsContainer');
    const startActivityBtn = document.getElementById('startActivityBtn');
    questionsReady = false;
    if (startActivityBtn) {
      startActivityBtn.disabled = true;
      startActivityBtn.setAttribute('aria-busy', 'true');
    }

    try {
      // Archivo JSON para las ponderaciones 
      try {
        const ponderacionesResponse = await fetch('../RECURSOS/data/ponderaciones.json');
        if (ponderacionesResponse.ok) {
          feedbackRules = await ponderacionesResponse.json();
        }
      } catch (_) {
        feedbackRules = [];
      }
      // Archivo JSON para las preguntas de la unidad 2.1
      const questionFile = document.body.dataset.questionFile;
      if (!questionFile) {
        throw new Error('No se definió data-question-file en la página de actividad.');
      }
      const response = await fetch(questionFile);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${questionFile} (HTTP ${response.status})`);
      }
      const allQuestionsRaw = await response.json();

      if (!Array.isArray(allQuestionsRaw) || allQuestionsRaw.length === 0) {
        throw new Error('El JSON no contiene un arreglo de preguntas.');
      }
      
      shuffleArray(allQuestionsRaw);
      questions = allQuestionsRaw.slice(0, defaultQuestionCount).map((q, idx) => {
        const questionText = q.pregunta ?? q.question;
        const optionsOrig = q.opciones ?? q.options;
        const answerOrig  = q.respuesta_correcta ?? q.answer;

        if (!questionText || !Array.isArray(optionsOrig) || !answerOrig) {
          throw new Error(`Pregunta ${idx + 1} con formato inválido (faltan campos).`);
        }

        const optionsShuffled = shuffleArray([...optionsOrig]);
        let correctIndex = optionsShuffled.indexOf(answerOrig);

        if (correctIndex === -1) {
          const norm = s => String(s).trim();
          const normAnswer = norm(answerOrig);
          correctIndex = optionsShuffled.findIndex(o => norm(o) === normAnswer);
        }

        if (correctIndex === -1) {
          throw new Error(
            `La respuesta no coincide con ninguna opción en la pregunta: "${questionText.substring(0, 50)}..."`
          );
        }

        return {
          question: questionText,
          options: optionsShuffled,
          correct: correctIndex
        };
      });

      timeLimit = getActivityTimeLimit(questions.length);
      timeRemaining = timeLimit;
      const totalQuestionsValue = document.getElementById('totalQuestionsValue');
      const timeAvailableValue = document.getElementById('timeAvailableValue');
      const evaluationStatus = document.getElementById('evaluationStatus');
      if (totalQuestionsValue) totalQuestionsValue.textContent = questions.length;
      if (timeAvailableValue) timeAvailableValue.textContent = formatTime(timeLimit).replace(':00', ' min');
      if (evaluationStatus) evaluationStatus.textContent = 'Sin iniciar';

      container.innerHTML = '';
      questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
          <div class="question-number">Pregunta ${index + 1}</div>
          <div class="question-text">${q.question}</div>
          <div class="options">
            ${q.options.map((option, optIndex) => `
              <div class="option" role="button" tabindex="0" data-question-index="${index}" data-option-index="${optIndex}" id="q${index}opt${optIndex}">
                <div class="option-letter">${String.fromCharCode(97 + optIndex)})</div>
                <div class="option-text">${option}</div>
              </div>
            `).join('')}
          </div>
        `;
        container.appendChild(questionDiv);
      });

      time = completed = correctCount = 0;
      gameOver = false;
      activityStarted = false;
      selectedAnswers = {};
      document.getElementById('evaluateBtn').disabled = false;
      document.getElementById('gameStatus').style.display = 'none';
      document.body.style.animation = 'none';
      setEvaluationVisibility(false);
      questionsReady = true;
      if (startActivityBtn) {
        startActivityBtn.disabled = false;
        startActivityBtn.removeAttribute('aria-busy');
      }
      updateUI();
      clearInterval(timerInterval);

    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="question">
          ⚠️ <strong>Error al cargar preguntas:</strong><br>${err.message}
        </div>`;
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function setEvaluationVisibility(isVisible) {
    document.getElementById('questionsSection')?.classList.toggle('is-hidden', !isVisible);
    document.getElementById('activityControls')?.classList.toggle('is-hidden', !isVisible);
    document.getElementById('floatingTimer')?.classList.toggle('is-hidden', !isVisible);
    document.getElementById('startActivityBtn')?.classList.toggle('is-hidden', isVisible);
  }

  function startActivity() {
    if (activityStarted || gameOver) return;
    activityStarted = true;
    time = 0;
    timeRemaining = timeLimit;
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus) evaluationStatus.textContent = 'En progreso';
    setEvaluationVisibility(true);
    updateTimerDisplay();
    startTimer();
    document.getElementById('questionsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      time++;
      timeRemaining = Math.max(0, timeLimit - time);
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        evaluateActivity(true);
      }
    }, 1000);
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    const floatingTimerValue = document.getElementById('floatingTimerValue');
    if (floatingTimerValue) floatingTimerValue.textContent = formatTime(timeRemaining);
  }

  function updateProgress() {
    completed = Object.keys(selectedAnswers).length;
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus && activityStarted && !gameOver) evaluationStatus.textContent = 'En progreso';
  }

  function updateUI() {
    const totalQuestions = questions.length > 0 ? questions.length : defaultQuestionCount;
    const totalQuestionsValue = document.getElementById('totalQuestionsValue');
    if (totalQuestionsValue) totalQuestionsValue.textContent = totalQuestions;
    updateTimerDisplay();
  }

  function selectOption(qIndex, oIndex) {
    if (gameOver || !activityStarted) return;
    for (let i = 0; i < questions[qIndex].options.length; i++) {
      document.getElementById(`q${qIndex}opt${i}`).classList.remove('selected');
    }
    document.getElementById(`q${qIndex}opt${oIndex}`).classList.add('selected');
    selectedAnswers[qIndex] = oIndex;
    updateProgress();
  }

  function evaluateActivity(force = false) {
    force = force === true;
    if (gameOver || !activityStarted) return;
    if (!force && completed < questions.length) {
      return showGameStatus("⚠️ ¡Selecciona una opción para todas las preguntas antes de evaluar la actividad!", "continue", true);
    }
    let correct = 0;

    questions.forEach((q, i) => {
      const userAns = selectedAnswers[i];
      const correctAns = q.correct;

      for (let j = 0; j < q.options.length; j++) {
        const optEl = document.getElementById(`q${i}opt${j}`);
        optEl.classList.remove('selected', 'correct', 'incorrect');
        if (j === userAns) {
          optEl.classList.add(userAns === correctAns ? 'correct' : 'incorrect');
        }
      }
      if (userAns === correctAns) correct++;
    });

    correctCount = correct;
    const score = calculateScore(correct, questions.length);
    const grade = calculateGrade(correct);
    gameOver = true;
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus) evaluationStatus.textContent = 'Enviado';
    updateUI();
    checkGameEnd(correct, grade, score, force);
  }

  function calculateScore(correct, total) {
    if (total <= 0) return 0;
    return Math.round((correct / total) * 100) / 10;
  }

  function calculateGrade(correct) {
    return correct * 0.5;
  }

  function formatGrade(grade) {
    return Number.isInteger(grade) ? String(grade) : grade.toFixed(1);
  }

function getFeedback(correct) {
  // Buscamos la regla exacta donde la propiedad "aciertos" coincida con la variable "correct"
  const rule = feedbackRules.find(r => r.aciertos === correct);
  
  return rule || {
    type: 'victory',
    icon: 'fas fa-trophy',
    text: '¡Actividad finalizada! (Regla no encontrada)'
  };
}

  function checkGameEnd(correct, grade, score, timeExpired = false) {
    const btn = document.getElementById('evaluateBtn');
    const feedback = getFeedback(correct);
    clearInterval(timerInterval);

    showGameStatus(
      `<div class="quiz-result ${feedback.type}">
        <div class="grade-value">${formatGrade(grade)}</div>
        <div class="score-value"> Aciertos: ${correct} de ${questions.length} </div>
        <div class="quiz-message">${timeExpired ? 'El tiempo se agotó. ' : ''}${feedback.text}</div>
      </div>`,
      feedback.type
    );
    btn.disabled = true;
    document.body.style.animation = score >= 8 ? 'victoryGlow 2s infinite' : score <= 5 ? 'defeatPulse 1s infinite' : 'none';
  }

  function resetActivity() {
    clearInterval(timerInterval);
    initGame();
  }

  function showGameStatus(msg, type, autoHide = false) {
    const div = document.getElementById('gameStatus');
    div.innerHTML = msg;
    div.className = `game-status ${type}`;
    div.style.display = 'block';
    if (autoHide) setTimeout(() => div.style.display = 'none', 4000);
  }

  let activityFeedbackState = {};
  let activityDragState = null;
  let activityAttempt = 0;
  let unansweredModalResolve = null;
  let unansweredModalPreviousFocus = null;

  function getLastGradeStorageKey() {
    return `${getActivityKey()}:last-grade`;
  }

  function updateLastGradeDisplay() {
    const lastGradeValue = document.getElementById('lastGradeValue');
    if (!lastGradeValue) return;
    lastGradeValue.textContent = sessionStorage.getItem(getLastGradeStorageKey()) || 'Sin calificación';
  }

  function hasStoredLastGrade() {
    return Boolean(sessionStorage.getItem(getLastGradeStorageKey()));
  }

  function setTopActionButton(mode = 'auto') {
    const startActivityBtn = document.getElementById('startActivityBtn');
    const resetActivityBtn = document.getElementById('resetActivityBtn');
    const shouldShowRetry = mode === 'retry' || (mode === 'auto' && hasStoredLastGrade());

    startActivityBtn?.classList.toggle('is-hidden', shouldShowRetry);
    resetActivityBtn?.classList.toggle('is-hidden', !shouldShowRetry);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDurationLabel(totalSeconds) {
    return totalSeconds % 60 === 0 ? `${totalSeconds / 60} min` : formatTime(totalSeconds);
  }

  function getQuestionKey(question) {
    return String(question.id);
  }

  function findActivityQuestion(questionId) {
    return questions.find(question => getQuestionKey(question) === String(questionId));
  }

  function normalizeActivityQuestion(rawQuestion, index) {
    const type = rawQuestion.type || 'opcion_multiple';
    const id = rawQuestion.id ?? `pregunta-${index + 1}`;
    const base = { id, type };

    if (type === 'verdadero_falso') {
      if (typeof rawQuestion.statement !== 'string' || typeof rawQuestion.answer !== 'boolean') {
        throw new Error(`Pregunta ${index + 1} con formato inválido de verdadero/falso.`);
      }
      return {
        ...base,
        statement: rawQuestion.statement,
        answer: rawQuestion.answer
      };
    }

    if (type === 'ordenar_oracion') {
      if (!Array.isArray(rawQuestion.segments) || !Array.isArray(rawQuestion.answer)) {
        throw new Error(`Pregunta ${index + 1} con formato inválido de ordenar oración.`);
      }
      return {
        ...base,
        question: rawQuestion.question || '',
        segments: [...rawQuestion.segments],
        answer: [...rawQuestion.answer]
      };
    }

    if (type === 'completar_oracion') {
      const questionText = rawQuestion.question;
      const wordBank = rawQuestion.wordBank ?? rawQuestion.options ?? rawQuestion.opciones;
      const answer = Array.isArray(rawQuestion.answer)
        ? [...rawQuestion.answer]
        : [rawQuestion.respuesta_correcta ?? rawQuestion.answer].filter(Boolean);

      if (!questionText || !Array.isArray(wordBank) || answer.length === 0) {
        throw new Error(`Pregunta ${index + 1} con formato inválido de completar oración.`);
      }

      answer.forEach(expectedWord => {
        if (!wordBank.includes(expectedWord)) {
          throw new Error(`La respuesta no coincide con el banco de palabras en la pregunta ${index + 1}.`);
        }
      });

      return {
        ...base,
        type: 'completar_oracion',
        question: questionText,
        wordBank: shuffleArray([...wordBank]),
        answer
      };
    }

    const questionText = rawQuestion.pregunta ?? rawQuestion.question;
    const options = rawQuestion.opciones ?? rawQuestion.options;
    const answer = rawQuestion.respuesta_correcta ?? rawQuestion.answer;

    if (!questionText || !Array.isArray(options) || typeof answer !== 'string') {
      throw new Error(`Pregunta ${index + 1} con formato inválido.`);
    }

    if (!options.includes(answer)) {
      throw new Error(`La respuesta no coincide con ninguna opción en la pregunta ${index + 1}.`);
    }

    return {
      ...base,
      type: 'opcion_multiple',
      question: questionText,
      options: shuffleArray([...options]),
      answer
    };
  }

  function getAnsweredQuestionsCount() {
    return questions.filter(isActivityQuestionAnswered).length;
  }

  function isActivityQuestionAnswered(question) {
    const key = getQuestionKey(question);
    if (!Object.prototype.hasOwnProperty.call(selectedAnswers, key)) return false;
    const answer = selectedAnswers[key];
    if (question.type === 'completar_oracion') {
      return Array.isArray(answer)
        && answer.length === question.answer.length
        && answer.every(wordIndex => Number.isInteger(wordIndex));
    }
    if (question.type === 'ordenar_oracion') {
      return Array.isArray(answer) && answer.length === question.segments.length;
    }
    return answer !== undefined && answer !== null && answer !== '';
  }

  function arraysMatch(left, right) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => item === right[index]);
  }

  function isActivityQuestionCorrect(question) {
    const key = getQuestionKey(question);
    if (!isActivityQuestionAnswered(question)) return false;

    const answer = selectedAnswers[key];
    if (question.type === 'verdadero_falso') {
      return answer === question.answer;
    }
    if (question.type === 'completar_oracion') {
      const placedWords = answer.map(wordIndex => question.wordBank[wordIndex]);
      return arraysMatch(placedWords, question.answer);
    }
    if (question.type === 'ordenar_oracion') {
      const arrangedSegments = answer.map(segmentIndex => question.segments[segmentIndex]);
      return arraysMatch(arrangedSegments, question.answer);
    }
    return answer === question.answer;
  }

  function getOrderAnswer(question) {
    const answer = selectedAnswers[getQuestionKey(question)];
    return Array.isArray(answer) ? [...answer] : [];
  }

  function getCompletionAnswer(question) {
    const answer = selectedAnswers[getQuestionKey(question)];
    const blanks = Array(question.answer.length).fill(null);
    if (!Array.isArray(answer)) return blanks;
    answer.slice(0, blanks.length).forEach((wordIndex, index) => {
      blanks[index] = Number.isInteger(wordIndex) ? wordIndex : null;
    });
    return blanks;
  }

  function getFeedbackClass(question, value, optionKind = 'single') {
    if (!gameOver || activityFeedbackState[getQuestionKey(question)] === undefined) return '';
    const correct = activityFeedbackState[getQuestionKey(question)];

    if (optionKind === 'order-zone' || optionKind === 'completion-slot') {
      return correct ? ' correct' : ' incorrect';
    }

    const selectedAnswer = selectedAnswers[getQuestionKey(question)];
    if (selectedAnswer !== value) return '';
    return correct ? ' correct' : ' incorrect';
  }

  function renderSingleChoiceQuestion(question) {
    const selectedAnswer = selectedAnswers[getQuestionKey(question)];
    return `
      <div class="options" role="radiogroup" aria-label="Opciones de respuesta">
        ${question.options.map((option, optionIndex) => {
          const selected = selectedAnswer === option;
          const stateClass = selected ? ' selected' : '';
          const feedbackClass = getFeedbackClass(question, option);
          const disabled = gameOver ? ' disabled' : '';
          return `
            <button type="button" class="option${stateClass}${feedbackClass}" data-action="select-option" data-question-id="${escapeHtml(question.id)}" data-option-index="${optionIndex}" role="radio" aria-checked="${selected}"${disabled}>
              <span class="option-letter">${String.fromCharCode(97 + optionIndex)})</span>
              <span class="option-text">${escapeHtml(option)}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderCompletionQuestion(question) {
    const placedWords = getCompletionAnswer(question);
    const usedWords = new Set(placedWords.filter(wordIndex => Number.isInteger(wordIndex)));
    const sentenceParts = question.question.split('_____');
    const disabled = gameOver ? ' disabled' : '';

    return `
      <div class="completion-sentence">
        ${sentenceParts.map((part, index) => {
          const slotIndex = index;
          const wordIndex = placedWords[slotIndex];
          const hasSlot = slotIndex < question.answer.length;
          const hasAnswer = Number.isInteger(wordIndex);
          const stateClass = hasAnswer ? ' has-answer' : '';
          const feedbackClass = gameOver ? getFeedbackClass(question, null, 'completion-slot') : '';
          return `${escapeHtml(part)}${hasSlot ? `
            <button type="button" class="completion-inline-slot${stateClass}${feedbackClass}" data-action="clear-completion-slot" data-question-id="${escapeHtml(question.id)}" data-slot-index="${slotIndex}" data-drop-target="completion" aria-label="Espacio ${slotIndex + 1}"${disabled}>
              ${hasAnswer ? escapeHtml(question.wordBank[wordIndex]) : ''}
            </button>
          ` : ''}`;
        }).join('')}
      </div>
      <div class="completion-word-bank" role="list" aria-label="Banco de palabras">
        ${question.wordBank.map((word, wordIndex) => {
          if (usedWords.has(wordIndex)) return '';
          return `
            <button type="button" class="completion-word" data-action="place-completion-word" data-question-id="${escapeHtml(question.id)}" data-word-index="${wordIndex}" draggable="${!gameOver}"${disabled}>
              ${escapeHtml(word)}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTrueFalseQuestion(question) {
    const choices = [
      { label: 'Verdadero', value: true },
      { label: 'Falso', value: false }
    ];
    const selectedAnswer = selectedAnswers[getQuestionKey(question)];
    const disabled = gameOver ? ' disabled' : '';

    return `
      <div class="options true-false-options" role="radiogroup" aria-label="Selecciona verdadero o falso">
        ${choices.map(choice => {
          const selected = selectedAnswer === choice.value;
          const stateClass = selected ? ' selected' : '';
          const feedbackClass = getFeedbackClass(question, choice.value);
          return `
            <button type="button" class="option true-false-choice${stateClass}${feedbackClass}" data-action="select-true-false" data-question-id="${escapeHtml(question.id)}" data-value="${choice.value}" role="radio" aria-checked="${selected}"${disabled}>
              <span class="option-letter"><i class="fas ${choice.value ? 'fa-check' : 'fa-xmark'}" aria-hidden="true"></i></span>
              <span class="option-text">${choice.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderOrderingQuestion(question) {
    const key = getQuestionKey(question);
    const order = getOrderAnswer(question);
    const usedSegments = new Set(order);
    const availableSegments = question.segments
      .map((segment, segmentIndex) => ({ segment, segmentIndex }))
      .filter(item => !usedSegments.has(item.segmentIndex));
    const disabled = gameOver ? ' disabled' : '';
    const feedbackClass = gameOver ? getFeedbackClass(question, null, 'order-zone') : '';

    return `
      <div class="ordering-board" data-order-question="${escapeHtml(question.id)}">
        <div class="ordering-placed${feedbackClass}" data-order-dropzone data-question-id="${escapeHtml(question.id)}" role="list" aria-label="Segmentos colocados">
          ${order.length ? order.map((segmentIndex, placedIndex) => `
            <button type="button" class="ordering-segment placed" data-action="remove-segment" data-question-id="${escapeHtml(question.id)}" data-segment-index="${segmentIndex}" data-placed-index="${placedIndex}" draggable="${!gameOver}" aria-label="Quitar segmento: ${escapeHtml(question.segments[segmentIndex])}"${disabled}>
              ${escapeHtml(question.segments[segmentIndex])}
            </button>
          `).join('') : ''}
        </div>

        <div class="ordering-available" role="list" aria-label="Fragmentos">
          ${availableSegments.map(({ segment, segmentIndex }) => `
            <button type="button" class="ordering-segment available" data-action="add-segment" data-question-id="${escapeHtml(question.id)}" data-segment-index="${segmentIndex}" draggable="${!gameOver}" aria-label="Agregar segmento: ${escapeHtml(segment)}"${disabled}>
              ${escapeHtml(segment)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderActivityQuestion(question, index) {
    const prompt = question.type === 'verdadero_falso' ? question.statement : question.question;
    let interaction = '';

    if (question.type === 'completar_oracion') {
      interaction = renderCompletionQuestion(question);
    } else if (question.type === 'verdadero_falso') {
      interaction = renderTrueFalseQuestion(question);
    } else if (question.type === 'ordenar_oracion') {
      interaction = renderOrderingQuestion(question);
    } else {
      interaction = renderSingleChoiceQuestion(question);
    }

    return `
      <div class="question" data-question-id="${escapeHtml(question.id)}" data-question-type="${escapeHtml(question.type)}">
        <div class="question-number">Pregunta ${index + 1}</div>
        ${question.type !== 'completar_oracion' && question.type !== 'ordenar_oracion' ? `<div class="question-text">${escapeHtml(prompt)}</div>` : ''}
        ${interaction}
      </div>
    `;
  }

  function renderActivityQuestions() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    container.innerHTML = questions.map(renderActivityQuestion).join('');
  }

  async function initGame() {
    const container = document.getElementById('questionsContainer');
    const startActivityBtn = document.getElementById('startActivityBtn');
    questionsReady = false;

    if (startActivityBtn) {
      startActivityBtn.disabled = true;
      startActivityBtn.setAttribute('aria-busy', 'true');
    }

    try {
      try {
        const ponderacionesResponse = await fetch('../RECURSOS/data/ponderaciones.json');
        feedbackRules = ponderacionesResponse.ok ? await ponderacionesResponse.json() : [];
      } catch (_) {
        feedbackRules = [];
      }

      const questionFile = document.body.dataset.questionFile;
      if (!questionFile) {
        throw new Error('No se definió data-question-file en la página de actividad.');
      }

      const response = await fetch(questionFile);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${questionFile} (HTTP ${response.status})`);
      }

      const allQuestionsRaw = await response.json();
      if (!Array.isArray(allQuestionsRaw) || allQuestionsRaw.length === 0) {
        throw new Error('El JSON no contiene un arreglo de preguntas.');
      }

      const selectedRawQuestions = shuffleArray([...allQuestionsRaw]).slice(0, defaultQuestionCount);
      questions = selectedRawQuestions.map(normalizeActivityQuestion);

      selectedAnswers = {};
      activityFeedbackState = {};
      activityDragState = null;
      time = 0;
      completed = 0;
      correctCount = 0;
      gameOver = false;
      activityStarted = false;
      timeLimit = getActivityTimeLimit(questions.length);
      timeRemaining = timeLimit;
      clearInterval(timerInterval);

      renderActivityQuestions();

      const totalQuestionsValue = document.getElementById('totalQuestionsValue');
      const timeAvailableValue = document.getElementById('timeAvailableValue');
      const evaluationStatus = document.getElementById('evaluationStatus');
      const evaluateBtn = document.getElementById('evaluateBtn');
      const gameStatus = document.getElementById('gameStatus');

      if (totalQuestionsValue) totalQuestionsValue.textContent = questions.length;
      if (timeAvailableValue) timeAvailableValue.textContent = formatDurationLabel(timeLimit);
      if (evaluationStatus) evaluationStatus.textContent = 'Sin iniciar';
      updateLastGradeDisplay();
      setTopActionButton('auto');
      if (evaluateBtn) evaluateBtn.disabled = false;
      if (gameStatus) gameStatus.style.display = 'none';
      document.body.style.animation = 'none';

      setEvaluationVisibility(false);
      questionsReady = true;
      if (startActivityBtn) {
        startActivityBtn.disabled = false;
        startActivityBtn.removeAttribute('aria-busy');
      }
      updateUI();
      return true;
    } catch (err) {
      console.error(err);
      if (container) {
        container.innerHTML = `
          <div class="question">
            ⚠️ <strong>Error al cargar preguntas:</strong><br>${escapeHtml(err.message)}
          </div>`;
      }
      if (startActivityBtn) startActivityBtn.removeAttribute('aria-busy');
      showGameStatus(`No se pudo preparar la actividad: ${escapeHtml(err.message)}`, 'continue');
      return false;
    }
  }

  function setEvaluationVisibility(isVisible) {
    const questionsSection = document.getElementById('questionsSection');
    const activityControls = document.getElementById('activityControls');
    const retryControls = document.getElementById('retryControls');
    const floatingTimer = document.getElementById('floatingTimer');
    const startActivityBtn = document.getElementById('startActivityBtn');
    const evaluateBtn = document.getElementById('evaluateBtn');
    const evaluationOverview = document.querySelector('.evaluation-overview');

    questionsSection?.classList.toggle('is-hidden', !isVisible);
    activityControls?.classList.toggle('is-hidden', !isVisible);
    retryControls?.classList.add('is-hidden');
    floatingTimer?.classList.toggle('is-hidden', !isVisible);
    evaluationOverview?.classList.remove('activity-results-heading');
    evaluationOverview?.classList.toggle('is-hidden', isVisible);
    if (isVisible) {
      startActivityBtn?.classList.add('is-hidden');
      document.getElementById('resetActivityBtn')?.classList.add('is-hidden');
    } else {
      setTopActionButton('auto');
    }
    if (evaluateBtn) evaluateBtn.disabled = false;
  }

  async function startActivity() {
    if (activityStarted || gameOver) return;
    if (!questionsReady || questions.length === 0) {
      const ready = await initGame();
      if (!ready) return;
    }

    activityStarted = true;
    activityAttempt++;
    gameOver = false;
    activityFeedbackState = {};
    time = 0;
    timeRemaining = timeLimit;
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus) evaluationStatus.textContent = 'En progreso';
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) gameStatus.style.display = 'none';
    document.querySelector('.evaluation-overview')?.classList.remove('activity-results-heading');
    setEvaluationVisibility(true);
    renderActivityQuestions();
    updateProgress();
    updateTimerDisplay();
    startTimer();
    document.getElementById('questionsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateProgress() {
    completed = getAnsweredQuestionsCount();
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus && activityStarted && !gameOver) evaluationStatus.textContent = 'En progreso';
  }

  function updateUI() {
    const totalQuestions = questions.length > 0 ? questions.length : defaultQuestionCount;
    const totalQuestionsValue = document.getElementById('totalQuestionsValue');
    const timeAvailableValue = document.getElementById('timeAvailableValue');
    if (totalQuestionsValue) totalQuestionsValue.textContent = totalQuestions;
    if (timeAvailableValue && timeLimit > 0) timeAvailableValue.textContent = formatDurationLabel(timeLimit);
    updateTimerDisplay();
  }

  function setSingleAnswer(question, value) {
    if (gameOver || !activityStarted) return;
    selectedAnswers[getQuestionKey(question)] = value;
    renderActivityQuestions();
    updateProgress();
  }

  function placeCompletionWord(question, wordIndex, slotIndex = null) {
    if (gameOver || !activityStarted) return;
    const key = getQuestionKey(question);
    const nextAnswer = getCompletionAnswer(question).map(currentWordIndex => (
      currentWordIndex === wordIndex ? null : currentWordIndex
    ));
    const targetSlot = slotIndex === null ? nextAnswer.findIndex(currentWordIndex => currentWordIndex === null) : slotIndex;
    if (targetSlot < 0 || targetSlot >= question.answer.length) return;

    nextAnswer[targetSlot] = wordIndex;
    selectedAnswers[key] = nextAnswer;
    renderActivityQuestions();
    updateProgress();
  }

  function clearCompletionSlot(question, slotIndex) {
    if (gameOver || !activityStarted) return;
    const key = getQuestionKey(question);
    const nextAnswer = getCompletionAnswer(question);
    if (slotIndex < 0 || slotIndex >= nextAnswer.length) return;
    nextAnswer[slotIndex] = null;
    if (nextAnswer.some(wordIndex => Number.isInteger(wordIndex))) {
      selectedAnswers[key] = nextAnswer;
    } else {
      delete selectedAnswers[key];
    }
    renderActivityQuestions();
    updateProgress();
  }

  function placeOrderSegment(question, segmentIndex, insertIndex = null) {
    if (gameOver || !activityStarted) return;
    const key = getQuestionKey(question);
    const currentOrder = getOrderAnswer(question);
    const existingIndex = currentOrder.indexOf(segmentIndex);
    const nextOrder = currentOrder.filter(item => item !== segmentIndex);
    let targetIndex = insertIndex === null ? nextOrder.length : Math.max(0, Math.min(insertIndex, nextOrder.length));
    if (existingIndex > -1 && insertIndex !== null && existingIndex < insertIndex) {
      targetIndex = Math.max(0, targetIndex - 1);
    }
    nextOrder.splice(targetIndex, 0, segmentIndex);
    selectedAnswers[key] = nextOrder;
    renderActivityQuestions();
    updateProgress();
  }

  function removeOrderSegment(question, segmentIndex) {
    if (gameOver || !activityStarted) return;
    const key = getQuestionKey(question);
    const nextOrder = getOrderAnswer(question).filter(item => item !== segmentIndex);
    if (nextOrder.length) {
      selectedAnswers[key] = nextOrder;
    } else {
      delete selectedAnswers[key];
    }
    renderActivityQuestions();
    updateProgress();
  }

  function handleActivityAction(actionElement) {
    const question = findActivityQuestion(actionElement.dataset.questionId);
    if (!question || gameOver || !activityStarted) return;

    if (actionElement.dataset.action === 'select-option') {
      setSingleAnswer(question, question.options[Number(actionElement.dataset.optionIndex)]);
    } else if (actionElement.dataset.action === 'place-completion-word') {
      placeCompletionWord(question, Number(actionElement.dataset.wordIndex));
    } else if (actionElement.dataset.action === 'clear-completion-slot') {
      clearCompletionSlot(question, Number(actionElement.dataset.slotIndex));
    } else if (actionElement.dataset.action === 'select-true-false') {
      setSingleAnswer(question, actionElement.dataset.value === 'true');
    } else if (actionElement.dataset.action === 'add-segment') {
      placeOrderSegment(question, Number(actionElement.dataset.segmentIndex));
    } else if (actionElement.dataset.action === 'remove-segment') {
      removeOrderSegment(question, Number(actionElement.dataset.segmentIndex));
    }
  }

  function handleActivityClick(event) {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement || !document.getElementById('questionsContainer')?.contains(actionElement)) return;
    event.preventDefault();
    handleActivityAction(actionElement);
  }

  function handleActivityKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement || !document.getElementById('questionsContainer')?.contains(actionElement)) return;
    event.preventDefault();
    handleActivityAction(actionElement);
  }

  function handleActivityDragStart(event) {
    if (gameOver || !activityStarted) return;
    const completionChoice = event.target.closest('[data-action="place-completion-word"]');
    const orderingSegment = event.target.closest('.ordering-segment[data-segment-index]');

    if (completionChoice) {
      activityDragState = {
        type: 'completion',
        questionId: completionChoice.dataset.questionId,
        wordIndex: Number(completionChoice.dataset.wordIndex)
      };
    } else if (orderingSegment) {
      activityDragState = {
        type: 'order',
        questionId: orderingSegment.dataset.questionId,
        segmentIndex: Number(orderingSegment.dataset.segmentIndex)
      };
    } else {
      activityDragState = null;
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(activityDragState));
  }

  function handleActivityDragOver(event) {
    if (!activityDragState || gameOver || !activityStarted) return;
    const completionTarget = event.target.closest('[data-drop-target="completion"]');
    const orderTarget = event.target.closest('[data-order-dropzone], .ordering-segment.placed');
    if (completionTarget || orderTarget) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      (completionTarget || orderTarget).classList.add('is-drag-over');
    }
  }

  function handleActivityDragLeave(event) {
    event.target.closest('.is-drag-over')?.classList.remove('is-drag-over');
  }

  function handleActivityDrop(event) {
    if (!activityDragState || gameOver || !activityStarted) return;
    event.preventDefault();
    document.querySelectorAll('.is-drag-over').forEach(element => element.classList.remove('is-drag-over'));

    if (activityDragState.type === 'completion') {
      const completionTarget = event.target.closest('[data-drop-target="completion"]');
      const question = findActivityQuestion(activityDragState.questionId);
      if (completionTarget && question) {
        placeCompletionWord(question, activityDragState.wordIndex, Number(completionTarget.dataset.slotIndex));
      }
    }

    if (activityDragState.type === 'order') {
      const orderTarget = event.target.closest('[data-order-dropzone], .ordering-segment.placed');
      const questionId = orderTarget?.dataset.questionId || orderTarget?.closest('[data-order-question]')?.dataset.orderQuestion;
      const question = findActivityQuestion(questionId);
      if (orderTarget && question) {
        const targetSegment = event.target.closest('.ordering-segment.placed');
        const insertIndex = targetSegment ? Number(targetSegment.dataset.placedIndex) : null;
        placeOrderSegment(question, activityDragState.segmentIndex, insertIndex);
      }
    }

    activityDragState = null;
  }

  function handleActivityDragEnd() {
    activityDragState = null;
    document.querySelectorAll('.is-drag-over').forEach(element => element.classList.remove('is-drag-over'));
  }

  function getUnansweredModalFocusableElements() {
    const modal = document.querySelector('#unansweredModal .activity-modal');
    if (!modal) return [];
    return [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.disabled && element.offsetParent !== null);
  }

  function showUnansweredModal(pending) {
    const overlay = document.getElementById('unansweredModal');
    const modal = overlay?.querySelector('.activity-modal');
    const message = document.getElementById('unansweredModalMessage');

    if (!overlay || !modal || !message) return Promise.resolve(false);

    unansweredModalPreviousFocus = document.activeElement;
    message.textContent = `Hay ${pending} preguntas sin responder. Si continúas, se contarán como incorrectas. ¿Deseas evaluar ahora?`;
    overlay.classList.remove('is-hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', handleUnansweredModalKeydown);

    window.requestAnimationFrame(() => {
      document.getElementById('continueAnsweringBtn')?.focus();
    });

    return new Promise(resolve => {
      unansweredModalResolve = resolve;
    });
  }

  function closeUnansweredModal(shouldEvaluate) {
    const overlay = document.getElementById('unansweredModal');
    overlay?.classList.add('is-hidden');
    overlay?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', handleUnansweredModalKeydown);

    const resolve = unansweredModalResolve;
    unansweredModalResolve = null;

    const focusTarget = document.getElementById('evaluateBtn') || unansweredModalPreviousFocus;
    unansweredModalPreviousFocus = null;
    focusTarget?.focus?.();

    if (resolve) resolve(shouldEvaluate);
  }

  function handleUnansweredModalKeydown(event) {
    const overlay = document.getElementById('unansweredModal');
    if (!overlay || overlay.classList.contains('is-hidden')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeUnansweredModal(false);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusableElements = getUnansweredModalFocusableElements();
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  async function evaluateActivity(force = false) {
    force = force === true;
    if (gameOver || !activityStarted) return;
    if (force && unansweredModalResolve) {
      closeUnansweredModal(false);
    }

    updateProgress();
    const pending = questions.length - completed;
    if (!force && pending > 0) {
      const confirmEvaluation = await showUnansweredModal(pending);
      if (!confirmEvaluation) return;
    }

    clearInterval(timerInterval);
    correctCount = questions.reduce((total, question) => total + (isActivityQuestionCorrect(question) ? 1 : 0), 0);
    activityFeedbackState = questions.reduce((state, question) => {
      state[getQuestionKey(question)] = isActivityQuestionCorrect(question);
      return state;
    }, {});

    const score = calculateScore(correctCount, questions.length);
    const grade = calculateGrade(correctCount);
    gameOver = true;
    activityStarted = false;
    const evaluationStatus = document.getElementById('evaluationStatus');
    if (evaluationStatus) evaluationStatus.textContent = force ? 'Tiempo agotado' : 'Enviado';

    renderActivityQuestions();
    updateUI();
    checkGameEnd(correctCount, grade, score, force);
  }

  function checkGameEnd(correct, grade, score, timeExpired = false) {
    const feedback = getFeedback(correct);
    clearInterval(timerInterval);
    sessionStorage.setItem(getLastGradeStorageKey(), formatGrade(grade));
    updateLastGradeDisplay();

    showGameStatus(
      `<div class="quiz-result ${feedback.type}">
        <div class="grade-value">${formatGrade(grade)}</div>
        <div class="score-value">Aciertos: ${correct} de ${questions.length}</div>
        <div class="quiz-message">${timeExpired ? 'El tiempo se agotó. ' : ''}${feedback.text}</div>
      </div>`,
      feedback.type
    );

    document.getElementById('activityControls')?.classList.add('is-hidden');
    document.getElementById('retryControls')?.classList.remove('is-hidden');
    document.getElementById('floatingTimer')?.classList.add('is-hidden');
    const evaluationOverview = document.querySelector('.evaluation-overview');
    evaluationOverview?.classList.remove('is-hidden', 'activity-questions-heading');
    evaluationOverview?.classList.add('activity-results-heading');
    setTopActionButton('retry');
    document.getElementById('evaluateBtn')?.setAttribute('disabled', 'disabled');
    document.body.style.animation = score >= 8 ? 'victoryGlow 2s infinite' : score <= 5 ? 'defeatPulse 1s infinite' : 'none';
  }

  async function resetActivity() {
    clearInterval(timerInterval);
    const ready = await initGame();
    if (!ready) return;
    await startActivity();
    document.getElementById('questionsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  window.renderSidebarNavigation?.({ mode: 'actividad' });

  /* Toggle menú lateral */
  const menuToggle = document.getElementById('menuToggle');
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  menuToggle?.setAttribute('aria-controls', 'sidebarNav');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Abrir menú de navegación');

  function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      if (sidebarOpen) {
          sidebarNav.classList.add('active');
          sidebarOverlay.classList.add('active');
          menuToggle.classList.add('active');
          menuToggle.innerHTML = '<i class="fas fa-times"></i>';
          menuToggle.setAttribute('aria-expanded', 'true');
          menuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
      } else {
          sidebarNav.classList.remove('active');
          sidebarOverlay.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
      }
      updateContainerSpacing();
  }

  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', toggleSidebar);

  function updateContainerSpacing() {
    const container = document.querySelector('.container');
    if (window.innerWidth <= 768) {
      container.style.marginLeft = 'auto';
      container.style.marginRight = 'auto';
      container.style.padding = '10px';
    } else {
      container.style.marginLeft = sidebarOpen ? '370px' : 'auto';
      container.style.marginRight = sidebarOpen ? '90px' : 'auto';
      container.style.padding = '20px';
    }
  }

  function updateReadingProgress() {
    const scroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = Math.min((scroll / height) * 100, 100);
    document.getElementById('readingProgressBar').style.width = `${percent}%`;
  }

  const scrollToTopBtn = document.getElementById('scrollToTop');
  window.addEventListener('scroll', () => {
      updateReadingProgress();
      if (window.pageYOffset > 300) {
          scrollToTopBtn.classList.add('visible');
      } else {
          scrollToTopBtn.classList.remove('visible');
      }
  });
  scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && sidebarOpen) toggleSidebar();
      updateContainerSpacing();
  });

  document.addEventListener('DOMContentLoaded', () => {
      applyActivityStory();
      initGame();
      document.getElementById('startActivityBtn')?.addEventListener('click', startActivity);
      document.getElementById('evaluateBtn')?.addEventListener('click', () => evaluateActivity(false));
      document.getElementById('resetActivityBtn')?.addEventListener('click', resetActivity);
      document.getElementById('resetActivityBottomBtn')?.addEventListener('click', resetActivity);
      document.getElementById('continueAnsweringBtn')?.addEventListener('click', () => closeUnansweredModal(false));
      document.getElementById('confirmEvaluateBtn')?.addEventListener('click', () => closeUnansweredModal(true));
      document.getElementById('questionsContainer')?.addEventListener('click', (event) => {
          const option = event.target.closest('.option[data-question-index][data-option-index]');
          if (!option) return;
          selectOption(Number(option.dataset.questionIndex), Number(option.dataset.optionIndex));
      });
      document.getElementById('questionsContainer')?.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const option = event.target.closest('.option[data-question-index][data-option-index]');
          if (!option) return;
          event.preventDefault();
          selectOption(Number(option.dataset.questionIndex), Number(option.dataset.optionIndex));
      });
      document.getElementById('questionsContainer')?.addEventListener('click', handleActivityClick);
      document.getElementById('questionsContainer')?.addEventListener('keydown', handleActivityKeydown);
      document.getElementById('questionsContainer')?.addEventListener('dragstart', handleActivityDragStart);
      document.getElementById('questionsContainer')?.addEventListener('dragover', handleActivityDragOver);
      document.getElementById('questionsContainer')?.addEventListener('dragleave', handleActivityDragLeave);
      document.getElementById('questionsContainer')?.addEventListener('drop', handleActivityDrop);
      document.getElementById('questionsContainer')?.addEventListener('dragend', handleActivityDragEnd);
      updateContainerSpacing();
  });
