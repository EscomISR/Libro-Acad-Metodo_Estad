function toggleCard(cardIdSuffix) {
            const card = document.getElementById(`card-${cardIdSuffix}`);
            if (!card) return;
            const wasActive = card.classList.contains('active');

            const allCards = document.querySelectorAll('.card');
            allCards.forEach(c => {
                if (c.id !== `card-${cardIdSuffix}` && c.classList.contains('active')) {
                    c.classList.remove('active');
                }
            });

            if (!wasActive) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
            updateCardAccessibility();
        }

        function activateWithKeyboard(element, handler) {
            element.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                handler(event);
            });
        }

        function updateCardAccessibility() {
            document.querySelectorAll('[data-card-target]').forEach(trigger => {
                const card = document.getElementById(`card-${trigger.dataset.cardTarget}`);
                trigger.setAttribute('aria-expanded', card?.classList.contains('active') ? 'true' : 'false');
            });
        }

        // Funciones para el modal del video
        function openVideoModal() {
            const modal = document.getElementById('videoModal');
            const videoFrame = document.getElementById('videoFrame');

            if (!modal || !videoFrame) {
                console.error('No se encontraron los elementos del modal');
                return;
            }

            // Video educativo de sistemas operativos que permite embed
            const videoId = document.body.dataset.videoId;
            if (!videoId) {
                console.error('No se definió data-video-id en la página de unidad');
                return;
            }
            videoFrame.src = `https://www.youtube.com/embed/${videoId}`;

            modal.classList.add('show');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeVideoModal() {
            const modal = document.getElementById('videoModal');
            const videoFrame = document.getElementById('videoFrame');

            if (!modal || !videoFrame) {
                console.error('No se encontraron los elementos del modal');
                return;
            }

            // Detener el video removiendo la fuente
            videoFrame.src = '';

            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        const videoTrigger = document.querySelector('.video-oval');
        if (videoTrigger) {
            videoTrigger.setAttribute('aria-label', videoTrigger.getAttribute('aria-label') || 'Abrir video de introducción');
            videoTrigger.addEventListener('click', openVideoModal);
            activateWithKeyboard(videoTrigger, openVideoModal);
        }

        document.querySelectorAll('[data-card-target]').forEach(trigger => {
            trigger.setAttribute('aria-controls', `card-${trigger.dataset.cardTarget}`);
            trigger.addEventListener('click', () => {
                toggleCard(trigger.dataset.cardTarget);
            });
            activateWithKeyboard(trigger, () => {
                toggleCard(trigger.dataset.cardTarget);
            });
        });
        updateCardAccessibility();

        document.querySelector('.close-btn')?.addEventListener('click', closeVideoModal);

        // Cerrar modal al hacer clic fuera del contenido
        document.getElementById('videoModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeVideoModal();
            }
        });

        // Cerrar modal con la tecla Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeVideoModal();
            }
        });

        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                if (!card.classList.contains('active')) {
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
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateY(0) scale(1)';
            });
        });

        document.addEventListener('click', (e) => {
            const cards = document.querySelectorAll('.card');
            let isClickInsideACard = false;

            cards.forEach(card => {
                if (card.contains(e.target)) {
                    isClickInsideACard = true;
                }
            });

            if (!isClickInsideACard) {
                cards.forEach(card => {
                    card.classList.remove('active');
                });
            }
        });
