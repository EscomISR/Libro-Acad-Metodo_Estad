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
  const secondsPerQuestion = 5;

  const activityStories = {
    'actividad_1_1': {
      title: 'Caso de investigación: el método adecuado',
      subtitle: 'El Dr. Salas debe iniciar un estudio científico y necesita definir con claridad el método que guiará su trabajo.',
      avatar: '🧑‍⚕️',
      caseName: 'Investigación del Dr. Salas',
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
    const avatar = document.getElementById('caseAvatar');
    const caseName = document.querySelector('.case-name');
    const evaluateBtn = document.getElementById('evaluateBtn');

    if (headerTitle) headerTitle.textContent = story.title;
    if (subtitle) subtitle.textContent = story.subtitle;
    if (instructionsTitle) instructionsTitle.innerHTML = '<i class="fas fa-clipboard-check"></i> Escenario de investigación';
    if (instructionsList) {
      instructionsList.innerHTML = `
        <li><strong>Situación:</strong> ${story.subtitle}</li>
        <li><strong>Misión:</strong> ${story.mission}</li>
        <li><strong>Mecánica:</strong> Cada respuesta correcta suma puntos al trabajo de investigación; cada error reduce su solidez.</li>
        <li><strong>Victoria:</strong> ${story.victory}</li>
        <li><strong>Derrota:</strong> Si hay demasiados errores, ${story.feedback.low}</li>
        <li><strong>Estrategia:</strong> ${story.strategy}</li>
      `;
    }
    if (avatar) avatar.textContent = story.avatar;
    if (caseName) caseName.textContent = story.caseName;
    if (evaluateBtn) evaluateBtn.innerHTML = '<i class="fas fa-check-circle"></i> Evaluar respuestas';
  }

  async function initGame() {
    const container = document.getElementById('questionsContainer');

    try {
      // Archivo JSON para las ponderaciones 
      const ponderacionesResponse = await fetch('../RECURSOS/data/ponderaciones.json');
      feedbackRules = await ponderacionesResponse.json();
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

      timeLimit = questions.length * secondsPerQuestion;
      timeRemaining = timeLimit;
      document.getElementById('answerProgressText').textContent = `0 / ${questions.length} respondidas`;

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
      selectedAnswers = {};
      document.getElementById('evaluateBtn').disabled = false;
      document.getElementById('gameStatus').style.display = 'none';
      document.body.style.animation = 'none';
      updateUI();
      clearInterval(timerInterval);
      startTimer();

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

  function startTimer() {
    document.getElementById('timerValue').textContent = `${timeRemaining}s`;
    timerInterval = setInterval(() => {
      time++;
      timeRemaining = Math.max(0, timeLimit - time);
      document.getElementById('timerValue').textContent = `${timeRemaining}s`;
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        evaluateActivity(true);
      }
    }, 1000);
  }

  function updateProgress() {
    completed = Object.keys(selectedAnswers).length;
    const percentage = (completed / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
  }

  function updateUI() {
    const totalQuestions = questions.length > 0 ? questions.length : defaultQuestionCount;
    const progressValue = gameOver ? correctCount : completed;
    document.getElementById('answerProgressBar').style.width = `${(progressValue / totalQuestions) * 100}%`;
    document.getElementById('answerProgressText').textContent = gameOver
      ? `${correctCount} / ${totalQuestions} aciertos`
      : `${completed} / ${totalQuestions} respondidas`;
    document.getElementById('correctValue').textContent = `${correctCount} / ${totalQuestions}`;
  }

  function selectOption(qIndex, oIndex) {
    if (gameOver) return;
    for (let i = 0; i < questions[qIndex].options.length; i++) {
      document.getElementById(`q${qIndex}opt${i}`).classList.remove('selected');
    }
    document.getElementById(`q${qIndex}opt${oIndex}`).classList.add('selected');
    selectedAnswers[qIndex] = oIndex;
    updateProgress();
  }

  function evaluateActivity(force = false) {
    force = force === true;
    if (gameOver) return;
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
      container.style.marginLeft = '20px';
      container.style.marginRight = '20px';
    } else {
      container.style.marginLeft = sidebarOpen ? '370px' : '90px';
      container.style.marginRight = '90px';
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
      document.getElementById('evaluateBtn')?.addEventListener('click', () => evaluateActivity(false));
      document.getElementById('resetActivityBtn')?.addEventListener('click', resetActivity);
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
      updateContainerSpacing();
  });
