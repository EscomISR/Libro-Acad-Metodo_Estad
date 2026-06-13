let time = 0;
  let attempts = 0;
  let errors = 0;
  let monsterHP = 8;
  const maxHP = 8;
  const maxErrors = 3;
  let gameOver = false;
  let timerInterval;
  let sidebarOpen = false;
  let selectedAnswers = {};
  let completed = 0;
  let questions = [];

  async function initGame() {
    const container = document.getElementById('questionsContainer');

    try {
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
      questions = allQuestionsRaw.slice(0, 8).map((q, idx) => {
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

      // Actualizar vida máxima del monstruo (por si hay menos de 8 preguntas)
      monsterHP = questions.length;
      document.getElementById('healthText').textContent = `${monsterHP} / ${monsterHP} HP`;

      container.innerHTML = '';
      questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
          <div class="question-number">Desafío ${index + 1}</div>
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

      time = attempts = errors = completed = 0;
      selectedAnswers = {};
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
    timerInterval = setInterval(() => {
      time++;
      document.getElementById('timerValue').textContent = `${time}s`;
    }, 1000);
  }

  function updateProgress() {
    completed = Object.keys(selectedAnswers).length;
    const percentage = (completed / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${percentage}%`;
  }

  function updateMonsterAvatar() {
    const avatar = document.getElementById('monsterAvatar');
    const healthPercentage = (monsterHP / questions.length) * 100;
    if (healthPercentage > 70) avatar.textContent = '📜';
    else if (healthPercentage > 40) avatar.textContent = '📄';
    else if (healthPercentage > 0) avatar.textContent = '📑';
    else avatar.textContent = '💥';
  }

  function updateUI() {
    const totalHP = questions.length > 0 ? questions.length : maxHP;
    document.getElementById('healthBar').style.width = `${(monsterHP / totalHP) * 100}%`;
    document.getElementById('healthText').textContent = `${monsterHP} / ${totalHP} HP`;
    const dots = document.querySelectorAll('.error-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < errors);
    });
    document.getElementById('attemptsValue').textContent = attempts;
    document.getElementById('errorsValue').textContent = `${errors} / ${maxErrors}`;
    updateMonsterAvatar();
  }

  function selectOption(qIndex, oIndex) {
    for (let i = 0; i < questions[qIndex].options.length; i++) {
      document.getElementById(`q${qIndex}opt${i}`).classList.remove('selected');
    }
    document.getElementById(`q${qIndex}opt${oIndex}`).classList.add('selected');
    selectedAnswers[qIndex] = oIndex;
    updateProgress();
  }

  function attack() {
    if (gameOver) return;
    if (completed < questions.length) {
      return showGameStatus("⚠️ ¡Selecciona una opción para todas las preguntas antes de evaluar el protocolo!", "continue");
    }
    attempts++;
    let correct = 0;

    questions.forEach((q, i) => {
      const userAns = selectedAnswers[i];
      const correctAns = q.correct;

      for (let j = 0; j < q.options.length; j++) {
        const optEl = document.getElementById(`q${i}opt${j}`);
        optEl.classList.remove('selected', 'correct', 'incorrect');
        if (j === correctAns) optEl.classList.add('correct');
        else if (j === userAns) optEl.classList.add('incorrect');
      }
      if (userAns === correctAns) correct++;
    });

    monsterHP = Math.max(0, questions.length - correct);
    errors = Math.min(maxErrors, questions.length - correct);
    updateUI();
    checkGameEnd();
  }

  function checkGameEnd() {
    const btn = document.getElementById('attackBtn');
    if (monsterHP <= 0) {
      gameOver = true;
      clearInterval(timerInterval);
      showGameStatus(`<i class='fas fa-trophy'></i> ¡PROTOCOLO APROBADO! Tiempo: ${time}s`, 'victory');
      btn.disabled = true;
      document.body.style.animation = 'victoryGlow 2s infinite';
    } else if (errors >= maxErrors) {
      gameOver = true;
      clearInterval(timerInterval);
      showGameStatus(`<i class='fas fa-skull'></i> ¡PROYECTO RECHAZADO! Demasiados errores`, 'defeat');
      btn.disabled = true;
      document.body.style.animation = 'defeatPulse 1s infinite';
    }
  }

  function resetBattle() {
    time = attempts = errors = completed = 0;
    monsterHP = questions.length > 0 ? questions.length : maxHP;
    gameOver = false;
    selectedAnswers = {};
    document.getElementById('timerValue').textContent = '0s';
    document.getElementById('attemptsValue').textContent = '0';
    document.getElementById('errorsValue').textContent = '0 / 3';
    document.getElementById('gameStatus').style.display = 'none';
    document.getElementById('attackBtn').disabled = false;
    document.getElementById('progressFill').style.width = '0%';
    document.body.style.animation = 'none';
    questions.forEach((q, i) => {
      q.options.forEach((_, j) => {
        const el = document.getElementById(`q${i}opt${j}`);
        if (el) el.classList.remove('selected', 'correct', 'incorrect');
      });
    });
    updateUI();
    clearInterval(timerInterval);
    startTimer();
  }

  function showGameStatus(msg, type) {
    const div = document.getElementById('gameStatus');
    div.innerHTML = msg;
    div.className = `game-status ${type}`;
    div.style.display = 'block';
    if (type === 'continue') setTimeout(() => div.style.display = 'none', 4000);
  }

  function showSolutions() {
    const answers = questions.map((q, i) => `${i + 1}. ${q.options[q.correct]}`).join('\n');
    alert(`💡 Respuestas Correctas:\n\n${answers}`);
  }

  /* Toggle menú lateral */
  const menuToggle = document.getElementById('menuToggle');
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      if (sidebarOpen) {
          sidebarNav.classList.add('active');
          sidebarOverlay.classList.add('active');
          menuToggle.classList.add('active');
          menuToggle.innerHTML = '<i class="fas fa-times"></i>';
      } else {
          sidebarNav.classList.remove('active');
          sidebarOverlay.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
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
      initGame();
      document.getElementById('attackBtn')?.addEventListener('click', attack);
      document.getElementById('resetBattleBtn')?.addEventListener('click', resetBattle);
      document.getElementById('showSolutionsBtn')?.addEventListener('click', showSolutions);
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
