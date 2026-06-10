(function () {
    function initImageViewer() {
        const images = document.querySelectorAll('.imagen-figura1');

        if (!images.length) {
            return;
        }

        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', 'Imagen ampliada');
        viewer.innerHTML = [
            '<button class="image-viewer-close" type="button" aria-label="Cerrar vista ampliada">X</button>',
            '<div class="image-viewer-content">',
            '<img src="" alt="">',
            '<div class="image-viewer-caption"></div>',
            '</div>'
        ].join('');

        document.body.appendChild(viewer);

        const viewerImage = viewer.querySelector('img');
        const viewerCaption = viewer.querySelector('.image-viewer-caption');
        const closeButton = viewer.querySelector('.image-viewer-close');

        function getCaption(image) {
            const container = image.closest('.figure-container');

            if (!container) {
                return image.alt || '';
            }

            const captions = Array.from(container.querySelectorAll('.figure-caption'))
                .map((caption) => caption.textContent.trim())
                .filter(Boolean);

            return captions.length ? captions.join(' - ') : image.alt || '';
        }

        function openViewer(image) {
            viewerImage.src = image.currentSrc || image.src;
            viewerImage.alt = image.alt || 'Imagen ampliada';
            viewerCaption.textContent = getCaption(image);
            viewer.classList.add('active');
            document.body.classList.add('image-viewer-open');
            closeButton.focus();
        }

        function closeViewer() {
            viewer.classList.remove('active');
            document.body.classList.remove('image-viewer-open');
            viewerImage.src = '';
        }

        images.forEach((image) => {
            image.setAttribute('tabindex', '0');
            image.setAttribute('role', 'button');
            image.setAttribute('aria-label', 'Abrir imagen ampliada');

            image.addEventListener('click', () => openViewer(image));
            image.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openViewer(image);
                }
            });
        });

        closeButton.addEventListener('click', closeViewer);
        viewer.addEventListener('click', (event) => {
            if (event.target === viewer) {
                closeViewer();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && viewer.classList.contains('active')) {
                closeViewer();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageViewer);
    } else {
        initImageViewer();
    }
})();
