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
            '<div class="image-viewer-zoom-area" role="button" tabindex="0" aria-label="Activar zoom de imagen">',
            '<img src="" alt="">',
            '</div>',
            '<div class="image-viewer-caption"></div>',
            '</div>'
        ].join('');

        document.body.appendChild(viewer);

        const zoomArea = viewer.querySelector('.image-viewer-zoom-area');
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

        function updateZoomScale() {
            const rect = viewerImage.getBoundingClientRect();

            if (!viewerImage.naturalWidth || !rect.width) {
                viewerImage.style.setProperty('--zoom-scale', '2.6');
                return;
            }

            const nativeToDisplayedRatio = viewerImage.naturalWidth / rect.width;
            const scale = Math.min(2.6, Math.max(1.4, nativeToDisplayedRatio));

            viewerImage.style.setProperty('--zoom-scale', scale.toFixed(2));
        }

        function openViewer(image) {
            viewerImage.src = image.currentSrc || image.src;
            viewerImage.alt = image.alt || 'Imagen ampliada';
            viewerCaption.textContent = getCaption(image);
            setZoom(false);
            viewer.classList.add('active');
            document.body.classList.add('image-viewer-open');
            closeButton.focus();

            if (viewerImage.complete && viewerImage.naturalWidth) {
                updateZoomScale();
            } else {
                viewerImage.onload = updateZoomScale;
            }
        }

        function closeViewer() {
            viewer.classList.remove('active');
            document.body.classList.remove('image-viewer-open');
            setZoom(false);
            viewerImage.src = '';
        }

        function setZoom(isZoomed) {
            viewer.classList.toggle('zoomed', isZoomed);
            zoomArea.setAttribute(
                'aria-label',
                isZoomed ? 'Quitar zoom de imagen' : 'Activar zoom de imagen'
            );

            if (!isZoomed) {
                viewerImage.style.setProperty('--zoom-x', '50%');
                viewerImage.style.setProperty('--zoom-y', '50%');
            }
        }

        function updateZoomPosition(event) {
            const rect = zoomArea.getBoundingClientRect();
            const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1) * 100;
            const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1) * 100;

            viewerImage.style.setProperty('--zoom-x', `${x}%`);
            viewerImage.style.setProperty('--zoom-y', `${y}%`);
        }

        function toggleZoom(event) {
            if (event) {
                updateZoomPosition(event);
            }

            setZoom(!viewer.classList.contains('zoomed'));
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
        zoomArea.addEventListener('click', toggleZoom);
        zoomArea.addEventListener('pointermove', (event) => {
            if (viewer.classList.contains('zoomed')) {
                updateZoomPosition(event);
            }
        });
        zoomArea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleZoom();
            }
        });

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
