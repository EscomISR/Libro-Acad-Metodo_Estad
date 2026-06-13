(function () {
    let sidebarOpen = false;

    const menuToggle = document.getElementById('menuToggle');
    const sidebarNav = document.getElementById('sidebarNav');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const floatingHomeBtn = document.querySelector('.floating-home-btn');
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (!menuToggle || !sidebarNav || !sidebarOverlay) {
        return;
    }

    function updateContainerSpacing() {
        const container = document.querySelector('.container');

        if (!container) {
            return;
        }

        if (window.innerWidth <= 768) {
            container.style.marginLeft = '20px';
            container.style.marginRight = '20px';
            container.style.padding = '10px';
        } else if (sidebarOpen && window.innerWidth > 768) {
            container.style.marginLeft = '370px';
            container.style.marginRight = '90px';
            container.style.padding = '20px';
        } else {
            container.style.marginLeft = 'auto';
            container.style.marginRight = 'auto';
            container.style.padding = '20px';
        }
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;

        if (sidebarOpen) {
            sidebarNav.classList.add('active');
            sidebarOverlay.classList.add('active');
            menuToggle.classList.add('active');
            menuToggle.classList.add('hidden');
            menuToggle.setAttribute('aria-hidden', 'true');
            menuToggle.setAttribute('tabindex', '-1');
            floatingHomeBtn?.classList.add('hidden');
            floatingHomeBtn?.setAttribute('aria-hidden', 'true');
            floatingHomeBtn?.setAttribute('tabindex', '-1');
            document.body.style.overflow = 'hidden';
        } else {
            sidebarNav.classList.remove('active');
            sidebarOverlay.classList.remove('active'); 
            menuToggle.classList.remove('active');
            menuToggle.classList.remove('hidden');
            menuToggle.removeAttribute('aria-hidden');
            menuToggle.removeAttribute('tabindex');
            floatingHomeBtn?.classList.remove('hidden');
            floatingHomeBtn?.removeAttribute('aria-hidden');
            floatingHomeBtn?.removeAttribute('tabindex');
            document.body.style.overflow = 'auto';
        }

        updateContainerSpacing();
    }

    function updateActiveSection() {
        const sections = document.querySelectorAll('.section[id], .activity-card[id]');
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        let currentSectionId = '';

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();

            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSectionId = section.id;
            }
        });

        navItems.forEach((item) => {
            const href = item.getAttribute('href') || '';
            const targetId = href.startsWith('#') ? href.slice(1) : `seccion-${item.dataset.section}`;
            const fallbackId = `seccion-${item.dataset.section}`;

            if (targetId === currentSectionId || fallbackId === currentSectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function updateReadingProgress() {
        const progressBar = document.getElementById('progressBar');

        if (!progressBar) {
            return;
        }

        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        progressBar.style.width = `${scrolled}%`;
    }

    function toggleScrollToTopBtn() {
        if (!scrollToTopBtn) {
            return;
        }

        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }

    function initSmoothAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (event) {
                const target = document.querySelector(this.getAttribute('href'));

                if (!target) {
                    return;
                }

                event.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'smooth'
                });
            });
        });
    }

    function initSidebarCloseButton() {
        const sidebarHeader = sidebarNav.querySelector('.sidebar-header');

        if (!sidebarHeader) {
            return;
        }

        let sidebarCloseBtn = sidebarHeader.querySelector('.sidebar-close');

        if (!sidebarCloseBtn) {
            sidebarCloseBtn = document.createElement('button');
            sidebarCloseBtn.type = 'button';
            sidebarCloseBtn.className = 'sidebar-close';
            sidebarCloseBtn.setAttribute('aria-label', 'Cerrar menú');
            sidebarCloseBtn.setAttribute('title', 'Cerrar menú');
            sidebarCloseBtn.innerHTML = '<i class="fas fa-times"></i>';
            sidebarHeader.appendChild(sidebarCloseBtn);
        }

        sidebarCloseBtn.addEventListener('click', (event) => {
            event.stopPropagation();

            if (sidebarOpen) {
                toggleSidebar();
            }
        });
    }

    function initUnidadInteractions() {
        initSidebarCloseButton();

        menuToggle.addEventListener('click', () => {
            if (!sidebarOpen) {
                toggleSidebar();
            }
        });
        sidebarOverlay.addEventListener('click', toggleSidebar);

        document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768 && sidebarOpen) {
                    toggleSidebar();
                }
            });
        });

        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        window.addEventListener('scroll', () => {
            updateActiveSection();
            updateReadingProgress();
            toggleScrollToTopBtn();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && sidebarOpen) {
                toggleSidebar();
            }

            updateContainerSpacing();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && sidebarOpen) {
                toggleSidebar();
            }

            if ((event.key === 'm' || event.key === 'M') && !event.ctrlKey && !event.altKey && !sidebarOpen) {
                toggleSidebar();
            }
        });

        initSmoothAnchors();
        updateActiveSection();
        updateReadingProgress();
        updateContainerSpacing();

        if (window.innerWidth <= 768) {
            sidebarNav.classList.remove('active');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnidadInteractions);
    } else {
        initUnidadInteractions();
    }
})();
