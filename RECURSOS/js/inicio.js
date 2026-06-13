// --- MANEJO DEL MODAL ---
    const modalContainer = document.getElementById('modal-container');
    const modalCloseButton = document.getElementById('modal-close-button');
    const cardsWithModal = document.querySelectorAll('.card[data-modal]');

    // Función para abrir el modal
    function openModal(modalId) {
        // Oculta todas las secciones del modal
        document.querySelectorAll('.modal-section').forEach(section => section.classList.remove('active'));

        // Muestra la sección correcta
        const activeSection = document.getElementById(`modal-${modalId}`);
        if (activeSection) {
            activeSection.classList.add('active');
            modalContainer.classList.add('show');
            document.body.style.overflow = 'hidden'; // Evita el scroll del fondo
        }
    }

    // Función para cerrar el modal
    function closeModal() {
        modalContainer.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restaura el scroll
    }

    // Asigna el evento click a cada tarjeta que abre un modal
    cardsWithModal.forEach(card => {
        card.addEventListener('click', () => {
            const modalId = card.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Asigna los eventos para cerrar el modal
    modalCloseButton.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', e => {
        // Cierra el modal si se hace clic en el fondo oscuro
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // --- EFECTO 3D HOVER (SOLO PARA DESKTOP) ---
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Solo aplica el efecto 3D si NO es un dispositivo táctil
    if (!isTouchDevice) {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateY = (x - centerX) / 25;
                const rotateX = (centerY - y) / 25;

                const maxRotation = 8;
                const clampedRotateX = Math.max(Math.min(rotateX, maxRotation), -maxRotation);
                const clampedRotateY = Math.max(Math.min(rotateY, maxRotation), -maxRotation);

                card.style.transform = `perspective(1200px)
                                      rotateX(${clampedRotateX}deg)
                                      rotateY(${clampedRotateY}deg)
                                      translateY(-8px)
                                      scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateY(0) scale(1)';
            });
        });
    }

    // --- MANEJO DE ACORDEÓN (SI APLICA) Y CLICS EXTERNOS ---
    document.addEventListener('click', (e) => {
        const allCards = document.querySelectorAll('.card');
        let isClickInsideACard = false;

        allCards.forEach(card => {
            if (card.contains(e.target)) {
                isClickInsideACard = true;
            }
        });

        if (!isClickInsideACard) {
            allCards.forEach(card => {
                card.classList.remove('active'); // Cierra los acordeones (si los hubiera)
            });
        }
    });

    // --- LÓGICA DEL REPRODUCTOR DE VIDEO ---
    const videoOverlay = document.getElementById('video-player-overlay');
    const videoFrame = document.getElementById('main-video-frame');

    function playVideo(videoId) {
        // Construir la URL de embed de YouTube
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        videoFrame.src = embedUrl;

        // Mostrar el modal del reproductor
        videoOverlay.classList.add('show');
    }

    function closeVideoPlayer() {
        // Ocultar el modal
        videoOverlay.classList.remove('show');
        // Detener el video limpiando el src
        videoFrame.src = '';
    }

    document.querySelectorAll('[data-video-id]').forEach(item => {
        item.addEventListener('click', () => {
            playVideo(item.dataset.videoId);
        });

        item.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            playVideo(item.dataset.videoId);
        });
    });

    document.getElementById('video-player-close')?.addEventListener('click', closeVideoPlayer);

    // Cerrar si se hace clic fuera del video
    videoOverlay.addEventListener('click', (e) => {
        if (e.target === videoOverlay) {
            closeVideoPlayer();
        }
    });
