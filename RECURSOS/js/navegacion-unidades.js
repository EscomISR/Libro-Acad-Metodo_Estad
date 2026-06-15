(function () {
    const iconSequence = ['book-open', 'bullseye', 'chart-line', 'clipboard-list', 'lightbulb', 'flask', 'microscope', 'list-check'];

    function getCurrentFile() {
        const file = window.location.pathname.split('/').pop() || '';
        try {
            return decodeURIComponent(file);
        } catch (_) {
            return file;
        }
    }

    function getContext() {
        const data = window.NAVEGACION_UNIDADES;
        const currentFile = getCurrentFile().toLowerCase();

        if (!data || !Array.isArray(data.unidadesTematicas)) {
            return null;
        }

        for (const unidad of data.unidadesTematicas) {
            for (let index = 0; index < unidad.temas.length; index += 1) {
                const tema = unidad.temas[index];

                if (tema.archivo.toLowerCase() === currentFile) {
                    return { unidad, tema, index, mode: 'tema' };
                }

                if (tema.actividad.toLowerCase() === currentFile) {
                    return { unidad, tema, index, mode: 'actividad' };
                }
            }
        }

        return null;
    }

    function createNavItem({ href, icon, text, dataSection }) {
        const link = document.createElement('a');
        link.href = href;
        link.className = 'nav-item';

        if (dataSection) {
            link.dataset.section = dataSection;
        }

        const iconElement = document.createElement('i');
        iconElement.className = `fas fa-${icon}`;
        link.appendChild(iconElement);
        link.appendChild(document.createTextNode(` ${text}`));

        return link;
    }

    function createSection(title, items) {
        const section = document.createElement('div');
        section.className = 'nav-section';

        const heading = document.createElement('div');
        heading.className = 'nav-section-title';
        heading.textContent = title;

        section.appendChild(heading);
        items.forEach((item) => section.appendChild(item));

        return section;
    }

    function getText(selector, parent = document) {
        return parent.querySelector(selector)?.textContent.trim() || '';
    }

    function getTopicContentItems() {
        return Array.from(document.querySelectorAll('.section[id^="seccion-"]')).map((section, index) => {
            const sectionId = section.id;
            const number = getText('.section-number', section);
            const title = getText('.section-title', section);
            const label = [number, title].filter(Boolean).join(' ');

            return createNavItem({
                href: `#${sectionId}`,
                icon: iconSequence[index % iconSequence.length],
                text: label,
                dataSection: sectionId.replace(/^seccion-/, '')
            });
        });
    }

    function getResourceItems(context, mode) {
        if (mode === 'actividad') {
            const items = [
                createNavItem({
                    href: context.tema.archivo,
                    icon: 'book-open',
                    text: 'Material del tema'
                })
            ];

            if (context.tema.video) {
                items.push(createNavItem({
                    href: `${context.tema.archivo}#${context.tema.video}`,
                    icon: 'play-circle',
                    text: 'Material audiovisual'
                }));
            }

            return items;
        }

        const items = [];
        const videoId = context.tema.video || document.querySelector('.section[id^="video-"]')?.id;

        if (videoId) {
            items.push(createNavItem({
                href: `#${videoId}`,
                icon: 'play-circle',
                text: 'Material audiovisual',
                dataSection: videoId
            }));
        }

        if (document.getElementById('actividad-aprendizaje')) {
            items.push(createNavItem({
                href: '#actividad-aprendizaje',
                icon: 'tasks',
                text: 'Actividad de aprendizaje',
                dataSection: 'actividad-aprendizaje'
            }));
        }

        return items;
    }

    function renderSidebarNavigation(options = {}) {
        const context = getContext();
        const sidebarNav = document.getElementById('sidebarNav');
        const navSections = sidebarNav?.querySelector('.nav-sections');

        if (!context || !sidebarNav || !navSections) {
            return;
        }

        const mode = options.mode || context.mode;
        const title = sidebarNav.querySelector('.sidebar-title');
        const subtitle = sidebarNav.querySelector('.sidebar-subtitle');

        if (title) {
            title.textContent = `${context.tema.id} ${context.tema.titulo}`;
        }

        if (subtitle) {
            subtitle.textContent = mode === 'actividad' ? 'Actividad de aprendizaje' : context.tema.descripcion;
        }

        const previousTopic = context.unidad.temas[context.index - 1];
        const nextTopic = context.unidad.temas[context.index + 1];
        const navigationItems = [
            createNavItem({
                href: window.NAVEGACION_UNIDADES.inicio,
                icon: 'home',
                text: 'Inicio'
            }),
            createNavItem({
                href: context.unidad.indice,
                icon: 'book-open',
                text: `Unidad ${context.unidad.numero}`
            })
        ];

        if (previousTopic) {
            navigationItems.push(createNavItem({
                href: previousTopic.archivo,
                icon: 'arrow-left',
                text: `${previousTopic.id} ${previousTopic.titulo}`
            }));
        }

        if (nextTopic) {
            navigationItems.push(createNavItem({
                href: nextTopic.archivo,
                icon: 'arrow-right',
                text: `${nextTopic.id} ${nextTopic.titulo}`
            }));
        }

        const contentItems = mode === 'actividad'
            ? [createNavItem({ href: '#inicio', icon: 'tasks', text: 'Actividad de aprendizaje', dataSection: 'inicio' })]
            : getTopicContentItems();

        const resourceItems = getResourceItems(context, mode);
        navSections.innerHTML = '';
        navSections.appendChild(createSection('Navegación', navigationItems));

        if (contentItems.length) {
            navSections.appendChild(createSection('Contenido', contentItems));
        }

        if (resourceItems.length) {
            navSections.appendChild(createSection('Recursos', resourceItems));
        }
    }

    window.renderSidebarNavigation = renderSidebarNavigation;
})();
