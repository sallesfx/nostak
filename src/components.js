/**
 * Componentes Web Orientados a Objetos do Nostak
 * Utiliza o padrão W3C Custom Elements para máxima reutilização e compatibilidade nativa.
 */

// Helper para descobrir a rota atual
function detectActiveRoute(element) {
    const explicitAttr = element.getAttribute('active');
    if (explicitAttr) return explicitAttr.toLowerCase();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('jornada')) return 'jornada';
    if (path.includes('listabloqueio') || path.includes('bloqueio')) return 'listabloqueio';
    if (path.includes('diario')) return 'diario';
    return 'temporizador'; // default: index.html
}

/**
 * TopAppBar unificado
 * <nostak-header></nostak-header>
 */
export class NostakHeader extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <header class="w-full h-16 top-0 sticky bg-surface-container-low border-b border-outline-variant z-50 flex items-center justify-between px-4 md:px-8 transition-colors">
                <a href="index.html" class="flex items-center gap-3 group">
                    <span class="material-symbols-outlined text-primary text-2xl group-hover:rotate-12 transition-transform duration-300">sailing</span>
                    <span class="font-headline-md text-headline-md font-bold text-primary tracking-wide">Nostak</span>
                </a>
                <div class="flex items-center gap-4">
                    <button class="material-symbols-outlined text-on-surface-variant hover:text-primary hover:bg-surface-container-high p-2 rounded transition-colors" title="Configurações" id="btn-header-settings">
                        settings
                    </button>
                </div>
            </header>
        `;
    }
}

/**
 * Menu lateral unificado
 * <nostak-sidebar active="temporizador|jornada|listabloqueio|diario"></nostak-sidebar>
 */
export class NostakSidebar extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['active'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const current = detectActiveRoute(this);

        const linkClasses = (route) => {
            const isActive = current === route;
            if (isActive) {
                return 'flex items-center gap-3 px-4 py-3 text-primary border-l-2 border-primary bg-surface-container-high transition-colors font-label-md text-label-md';
            }
            return 'flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors font-label-md text-label-md border-l-2 border-transparent';
        };

        this.innerHTML = `
            <aside class="hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 sticky top-16 left-0 bg-surface-container border-r border-outline-variant p-4 shrink-0 overflow-y-auto">
                <div class="mb-6 px-4 pt-2">
                    <h2 class="font-headline-md text-headline-md text-primary">Nostak</h2>
                    <p class="text-on-surface-variant font-label-sm text-label-sm mt-0.5 uppercase tracking-wider opacity-80">Navegando pelo Foco</p>
                </div>
                <nav class="flex-grow flex flex-col gap-1">
                    <a class="${linkClasses('jornada')}" href="jornada.html">
                        <span class="material-symbols-outlined">route</span> Jornada
                    </a>
                    <a class="${linkClasses('temporizador')}" href="index.html">
                        <span class="material-symbols-outlined">timer</span> Temporizador
                    </a>
                    <a class="${linkClasses('listabloqueio')}" href="listabloqueio.html">
                        <span class="material-symbols-outlined">block</span> Lista de Bloqueio
                    </a>
                    <a class="${linkClasses('diario')}" href="#" title="Em desenvolvimento">
                        <span class="material-symbols-outlined">book</span> Diário
                        <span class="ml-auto text-[10px] font-label-sm text-secondary bg-secondary-container/40 border border-secondary/30 px-1.5 py-0.5 rounded-sm uppercase">Em breve</span>
                    </a>
                </nav>
                <div class="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
                    <a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm" href="#">
                        <span class="material-symbols-outlined text-[20px]">tune</span> Configurações
                    </a>
                    <a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm" href="#">
                        <span class="material-symbols-outlined text-[20px]">help</span> Suporte
                    </a>
                    <div class="pt-3 mt-1 border-t border-outline-variant/60 flex items-center justify-center gap-6">
                        <a class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-label-sm text-label-sm" href="#" title="Site Oficial">
                            <span class="material-symbols-outlined text-[18px]">language</span>
                            <span>Site</span>
                        </a>
                        <a class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-label-sm text-label-sm" href="#" title="Instagram">
                            <span class="material-symbols-outlined text-[18px]">photo_camera</span>
                            <span>Instagram</span>
                        </a>
                    </div>
                </div>
            </aside>
        `;
    }
}

/**
 * Barra inferior mobile unificada
 * <nostak-mobile-nav active="temporizador|jornada|listabloqueio|diario"></nostak-mobile-nav>
 */
export class NostakMobileNav extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['active'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const current = detectActiveRoute(this);

        const linkClasses = (route) => {
            const isActive = current === route;
            if (isActive) {
                return 'flex flex-col items-center justify-center w-full py-1 text-primary';
            }
            return 'flex flex-col items-center justify-center w-full py-1 text-on-surface-variant hover:text-on-surface transition-colors';
        };

        this.innerHTML = `
            <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-outline-variant flex justify-around py-2 px-2 z-50">
                <a class="${linkClasses('jornada')}" href="jornada.html">
                    <span class="material-symbols-outlined">route</span>
                    <span class="text-[10px] font-label-md mt-0.5">Jornada</span>
                </a>
                <a class="${linkClasses('temporizador')}" href="index.html">
                    <span class="material-symbols-outlined">timer</span>
                    <span class="text-[10px] font-label-md mt-0.5">Tempo</span>
                </a>
                <a class="${linkClasses('listabloqueio')}" href="listabloqueio.html">
                    <span class="material-symbols-outlined">block</span>
                    <span class="text-[10px] font-label-md mt-0.5">Bloqueio</span>
                </a>
                <a class="${linkClasses('diario')}" href="#">
                    <span class="material-symbols-outlined">book</span>
                    <span class="text-[10px] font-label-md mt-0.5">Diário</span>
                </a>
            </nav>
        `;
    }
}

// Registro oficial dos Web Components no navegador
if (!customElements.get('nostak-header')) {
    customElements.define('nostak-header', NostakHeader);
}
if (!customElements.get('nostak-sidebar')) {
    customElements.define('nostak-sidebar', NostakSidebar);
}
if (!customElements.get('nostak-mobile-nav')) {
    customElements.define('nostak-mobile-nav', NostakMobileNav);
}
