/**
 * Componentes Web Orientados a Objetos do Nostak
 * Utiliza o padrão W3C Custom Elements para máxima reutilização e compatibilidade nativa.
 */

import { invokeTauri, playNauticalBell } from './ipc.js';

// Helper para descobrir a rota atual
function detectActiveRoute(element) {
    const explicitAttr = element.getAttribute('active');
    if (explicitAttr) return explicitAttr.toLowerCase();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('jornada')) return 'jornada';
    if (path.includes('listabloqueio') || path.includes('bloqueio')) return 'listabloqueio';
    return 'temporizador'; // default: index.html
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Gerencia abertura acessível de um modal (role="dialog", focus inicial e registro do elemento disparador)
 */
export function openModalDialog(modalEl, initialFocusSelector = null) {
    if (!modalEl) return;
    modalEl._triggerElement = document.activeElement;
    modalEl.classList.remove('hidden');
    modalEl.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
        const target = (initialFocusSelector && modalEl.querySelector(initialFocusSelector))
            || modalEl.querySelector(FOCUSABLE_SELECTOR);
        if (target && typeof target.focus === 'function') {
            target.focus();
        }
    });
}

/**
 * Gerencia fechamento acessível de um modal e devolve o foco ao botão disparador
 */
export function closeModalDialog(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.setAttribute('aria-hidden', 'true');

    const trigger = modalEl._triggerElement;
    if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
    }
    modalEl._triggerElement = null;
}

/**
 * Registra Focus Trap (Tab / Shift+Tab) e tecla Escape para qualquer modal
 */
export function bindModalKeyboardTrap(modalEl, onCloseCallback = null) {
    if (!modalEl || modalEl._a11yBound) return;
    modalEl._a11yBound = true;

    const handleClose = () => {
        if (typeof onCloseCallback === 'function') {
            onCloseCallback();
        } else {
            closeModalDialog(modalEl);
        }
    };

    document.addEventListener('keydown', (e) => {
        if (modalEl.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            handleClose();
            return;
        }

        if (e.key === 'Tab') {
            const focusables = Array.from(modalEl.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => !el.classList.contains('hidden') && el.offsetParent !== null);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first || !modalEl.contains(document.activeElement)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last || !modalEl.contains(document.activeElement)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });
}

let feedbackModalEl = null;
let feedbackResolver = null;

function ensureFeedbackDialogMounted() {
    if (feedbackModalEl && document.body.contains(feedbackModalEl)) return feedbackModalEl;
    let modal = document.getElementById('modal-nostak-dialog');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-nostak-dialog';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'nostak-dialog-title');
        modal.setAttribute('aria-describedby', 'nostak-dialog-message');
        modal.setAttribute('aria-hidden', 'true');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 hidden';
        modal.innerHTML = `
            <div class="bg-surface-container border border-outline-variant rounded-md p-6 sm:p-7 max-w-md w-full mx-4 relative shadow-2xl">
                <div class="flex items-start gap-3.5 mb-5">
                    <span id="nostak-dialog-icon" class="material-symbols-outlined text-2xl shrink-0 text-primary mt-0.5" aria-hidden="true">help</span>
                    <div class="flex-grow">
                        <h3 id="nostak-dialog-title" class="font-headline-sm text-headline-sm text-on-surface font-bold">Confirmação</h3>
                        <p id="nostak-dialog-message" class="text-on-surface-variant font-body-md text-sm mt-1.5 whitespace-pre-line leading-relaxed"></p>
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="nostak-dialog-btn-cancel" class="px-4 py-2 rounded-sm border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline text-xs uppercase tracking-wider font-label-md transition-colors">
                        Cancelar
                    </button>
                    <button type="button" id="nostak-dialog-btn-confirm" class="px-5 py-2 rounded-sm bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-tertiary transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const handleResolve = (val) => {
            closeModalDialog(modal);
            if (feedbackResolver) {
                const cb = feedbackResolver;
                feedbackResolver = null;
                cb(val);
            }
        };

        modal.querySelector('#nostak-dialog-btn-cancel')?.addEventListener('click', () => handleResolve(false));
        modal.querySelector('#nostak-dialog-btn-confirm')?.addEventListener('click', () => handleResolve(true));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleResolve(false);
        });

        bindModalKeyboardTrap(modal, () => handleResolve(false));
    }
    feedbackModalEl = modal;
    return feedbackModalEl;
}

export function nostakConfirm({
    title = 'Confirmação',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false
} = {}) {
    const modal = ensureFeedbackDialogMounted();
    const titleEl = modal.querySelector('#nostak-dialog-title');
    const msgEl = modal.querySelector('#nostak-dialog-message');
    const iconEl = modal.querySelector('#nostak-dialog-icon');
    const btnCancel = modal.querySelector('#nostak-dialog-btn-cancel');
    const btnConfirm = modal.querySelector('#nostak-dialog-btn-confirm');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) {
        btnCancel.textContent = cancelText;
        btnCancel.classList.remove('hidden');
    }
    if (btnConfirm) {
        btnConfirm.textContent = confirmText;
        if (isDestructive) {
            btnConfirm.className = 'px-5 py-2 rounded-sm bg-error/20 text-error border border-error/50 font-bold text-xs uppercase tracking-widest hover:bg-error hover:text-on-primary transition-colors';
            if (iconEl) {
                iconEl.textContent = 'warning';
                iconEl.className = 'material-symbols-outlined text-2xl shrink-0 text-error mt-0.5';
            }
        } else {
            btnConfirm.className = 'px-5 py-2 rounded-sm bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-tertiary transition-colors';
            if (iconEl) {
                iconEl.textContent = 'help';
                iconEl.className = 'material-symbols-outlined text-2xl shrink-0 text-primary mt-0.5';
            }
        }
    }

    return new Promise((resolve) => {
        feedbackResolver = resolve;
        openModalDialog(modal, '#nostak-dialog-btn-cancel');
    });
}

export function nostakAlert({
    title = 'Atenção',
    message = '',
    confirmText = 'Entendido',
    type = 'info'
} = {}) {
    const modal = ensureFeedbackDialogMounted();
    const titleEl = modal.querySelector('#nostak-dialog-title');
    const msgEl = modal.querySelector('#nostak-dialog-message');
    const iconEl = modal.querySelector('#nostak-dialog-icon');
    const btnCancel = modal.querySelector('#nostak-dialog-btn-cancel');
    const btnConfirm = modal.querySelector('#nostak-dialog-btn-confirm');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) btnCancel.classList.add('hidden');

    if (btnConfirm) {
        btnConfirm.textContent = confirmText;
        btnConfirm.className = 'px-5 py-2 rounded-sm bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-tertiary transition-colors';
    }

    if (iconEl) {
        if (type === 'error') {
            iconEl.textContent = 'error';
            iconEl.className = 'material-symbols-outlined text-2xl shrink-0 text-error mt-0.5';
        } else if (type === 'success') {
            iconEl.textContent = 'check_circle';
            iconEl.className = 'material-symbols-outlined text-2xl shrink-0 text-secondary mt-0.5';
        } else {
            iconEl.textContent = 'info';
            iconEl.className = 'material-symbols-outlined text-2xl shrink-0 text-primary mt-0.5';
        }
    }

    return new Promise((resolve) => {
        feedbackResolver = () => resolve();
        openModalDialog(modal, '#nostak-dialog-btn-confirm');
    });
}

window.nostakConfirm = nostakConfirm;
window.nostakAlert = nostakAlert;

/**
 * Abre o Modal Global de Configurações a partir de qualquer página
 */
export async function openSettingsModal() {
    let modal = document.getElementById('modal-global-settings');
    if (!modal) {
        ensureSettingsModalMounted();
        modal = document.getElementById('modal-global-settings');
    }
    if (!modal) return;

    try {
        const config = await invokeTauri('obter_configuracoes');
        if (config) {
            const soundInput = document.getElementById('settings-toggle-sound');
            const autoBreakInput = document.getElementById('settings-toggle-autobreak');
            const focusInput = document.getElementById('settings-input-focus');
            const breakInput = document.getElementById('settings-input-break');

            if (soundInput) {
                soundInput.checked = config.som_ativo !== false;
                soundInput.setAttribute('aria-checked', String(soundInput.checked));
            }
            if (autoBreakInput) {
                autoBreakInput.checked = config.auto_iniciar_descanso !== false;
                autoBreakInput.setAttribute('aria-checked', String(autoBreakInput.checked));
            }
            if (focusInput) focusInput.value = config.tempo_foco_minutos || 25;
            if (breakInput) breakInput.value = config.tempo_pausa_minutos || 5;
        }
    } catch (e) {
        console.error('[Nostak] Erro ao carregar configurações para o modal:', e);
    }

    const feedbackEl = document.getElementById('settings-status-feedback');
    if (feedbackEl) feedbackEl.classList.add('hidden');

    openModalDialog(modal, '#settings-input-focus');
}

function showSettingsFeedback(msg, isError = false) {
    const feedbackEl = document.getElementById('settings-status-feedback');
    if (!feedbackEl) return;
    feedbackEl.textContent = msg;
    feedbackEl.className = isError
        ? 'text-xs font-label-md uppercase tracking-wider px-3 py-2 rounded-sm border border-error/50 bg-error-container/20 text-error'
        : 'text-xs font-label-md uppercase tracking-wider px-3 py-2 rounded-sm border border-secondary/40 bg-secondary-container/20 text-secondary';
}

function ensureSettingsModalMounted() {
    if (document.getElementById('modal-global-settings')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'modal-global-settings';
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');
    wrapper.setAttribute('aria-labelledby', 'settings-dialog-title');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 hidden';
    wrapper.innerHTML = `
        <div class="bg-surface-container border border-outline-variant rounded-md p-6 sm:p-8 max-w-lg w-full mx-4 relative">
            <div class="flex items-center justify-between border-b border-outline-variant pb-3 mb-6">
                <div class="flex items-center gap-2 text-primary">
                    <span class="material-symbols-outlined text-lg" aria-hidden="true">tune</span>
                    <h3 id="settings-dialog-title" class="font-headline-sm text-headline-sm uppercase tracking-widest font-bold">Configurações da Embarcação</h3>
                </div>
                <button type="button" id="btn-close-global-settings" aria-label="Fechar configurações" class="text-on-surface-variant hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                </button>
            </div>

            <form id="form-global-settings" class="space-y-6">
                <!-- Preferências de Áudio e Ciclo -->
                <div class="space-y-3">
                    <h4 class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Preferências de Travessia</h4>

                    <div class="flex items-center justify-between p-3.5 bg-surface-container-low border border-outline-variant rounded-sm">
                        <div class="pr-4">
                            <div class="font-body-md text-sm text-on-surface flex items-center gap-2">
                                <span id="settings-title-sound">Sino Náutico (Alerta Sonoro)</span>
                                <button type="button" id="btn-test-bell" class="text-[11px] font-label-sm text-primary hover:text-on-primary hover:bg-primary/20 px-2.5 py-1 rounded-sm border border-primary/30 uppercase tracking-wider transition-colors">Testar</button>
                            </div>
                            <p class="font-label-sm text-xs text-on-surface-variant opacity-75 mt-0.5">Tocar badalada suave ao concluir ciclos de foco e descanso.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input id="settings-toggle-sound" aria-labelledby="settings-title-sound" role="switch" aria-checked="true" class="sr-only toggle-input" type="checkbox" checked>
                            <div class="w-12 h-6 bg-surface-container-highest border border-outline-variant rounded-sm toggle-track relative">
                                <div class="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-sm toggle-thumb"></div>
                            </div>
                        </label>
                    </div>

                    <div class="flex items-center justify-between p-3.5 bg-surface-container-low border border-outline-variant rounded-sm">
                        <div class="pr-4">
                            <div id="settings-title-autobreak" class="font-body-md text-sm text-on-surface">Descanso Automático</div>
                            <p class="font-label-sm text-xs text-on-surface-variant opacity-75 mt-0.5">Iniciar a contagem de Porto Seguro automaticamente ao finalizar o foco.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input id="settings-toggle-autobreak" aria-labelledby="settings-title-autobreak" role="switch" aria-checked="true" class="sr-only toggle-input" type="checkbox" checked>
                            <div class="w-12 h-6 bg-surface-container-highest border border-outline-variant rounded-sm toggle-track relative">
                                <div class="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-sm toggle-thumb"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Tempos Padrão -->
                <div class="space-y-3">
                    <h4 class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Calibração Padrão (Minutos)</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 bg-surface-container-low border border-outline-variant rounded-sm">
                            <label for="settings-input-focus" class="block text-xs uppercase font-label-sm text-on-surface-variant mb-1.5 cursor-pointer">Foco em Alto Mar</label>
                            <input type="number" id="settings-input-focus" min="1" max="180" value="25" class="w-full bg-surface-container border border-outline-variant rounded-sm px-3 py-1.5 text-center text-primary font-display-md text-lg font-bold focus:border-primary tabular-nums">
                        </div>
                        <div class="p-3 bg-surface-container-low border border-outline-variant rounded-sm">
                            <label for="settings-input-break" class="block text-xs uppercase font-label-sm text-on-surface-variant mb-1.5 cursor-pointer">Pausa em Porto</label>
                            <input type="number" id="settings-input-break" min="1" max="60" value="5" class="w-full bg-surface-container border border-outline-variant rounded-sm px-3 py-1.5 text-center text-secondary font-display-md text-lg font-bold focus:border-secondary tabular-nums">
                        </div>
                    </div>
                </div>

                <!-- Manutenção & Segurança -->
                <div class="space-y-3">
                    <h4 class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Manutenção e Segurança</h4>
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button type="button" id="btn-emergency-unblock" class="flex-1 py-2.5 px-3 rounded-sm border border-secondary/40 text-secondary hover:bg-secondary-container/30 text-xs font-label-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                            <span class="material-symbols-outlined text-base">anchor</span>
                            <span>Liberar Hosts (Emergência)</span>
                        </button>
                        <button type="button" id="btn-reset-progress" class="flex-1 py-2.5 px-3 rounded-sm border border-error/50 text-error hover:bg-error/10 text-xs font-label-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                            <span class="material-symbols-outlined text-base">restart_alt</span>
                            <span>Zerar Progresso</span>
                        </button>
                    </div>
                </div>

                <div id="settings-status-feedback" class="hidden"></div>

                <!-- Rodapé de Ações -->
                <div class="flex gap-3 pt-4 border-t border-outline-variant">
                    <button type="button" id="btn-cancel-global-settings" class="flex-1 py-2.5 rounded-sm border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline text-xs uppercase tracking-wider font-label-md transition-colors">
                        Fechar
                    </button>
                    <button type="submit" class="flex-1 py-2.5 rounded-sm bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-tertiary transition-colors">
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(wrapper);

    const closeModal = () => closeModalDialog(wrapper);
    bindModalKeyboardTrap(wrapper, closeModal);

    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper) closeModal();
    });

    document.getElementById('btn-close-global-settings')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-global-settings')?.addEventListener('click', closeModal);

    document.getElementById('btn-test-bell')?.addEventListener('click', () => {
        playNauticalBell('focus-end');
    });

    document.getElementById('settings-toggle-sound')?.addEventListener('change', (e) => {
        e.target.setAttribute('aria-checked', String(e.target.checked));
    });

    document.getElementById('settings-toggle-autobreak')?.addEventListener('change', (e) => {
        e.target.setAttribute('aria-checked', String(e.target.checked));
    });

    document.getElementById('btn-emergency-unblock')?.addEventListener('click', async () => {
        try {
            await invokeTauri('ancorar_porto_seguro');
            showSettingsFeedback('Bloqueios do arquivo hosts removidos e DNS limpo com sucesso.');
        } catch (err) {
            showSettingsFeedback('Falha ao liberar hosts: ' + err, true);
        }
    });

    document.getElementById('btn-reset-progress')?.addEventListener('click', async () => {
        const confirmed = await nostakConfirm({
            title: 'Zerar Progresso Náutico',
            message: 'Deseja realmente zerar todas as milhas náuticas e conquistas registradas na sua jornada?\nEsta manobra é definitiva e não pode ser revertida.',
            confirmText: 'Zerar Progresso',
            cancelText: 'Manter Dados',
            isDestructive: true
        });
        if (!confirmed) return;

        try {
            const configAtualizada = await invokeTauri('resetar_progresso');
            showSettingsFeedback('Histórico de progresso da jornada redefinido para zero.');
            if (configAtualizada) {
                window.dispatchEvent(new CustomEvent('nostak:config-updated', { detail: configAtualizada }));
            }
        } catch (err) {
            showSettingsFeedback('Erro ao zerar progresso: ' + err, true);
        }
    });

    document.getElementById('form-global-settings')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const somAtivo = document.getElementById('settings-toggle-sound')?.checked ?? true;
        const autoIniciarDescanso = document.getElementById('settings-toggle-autobreak')?.checked ?? true;
        const foco = Math.min(180, Math.max(1, parseInt(document.getElementById('settings-input-focus')?.value, 10) || 25));
        const pausa = Math.min(60, Math.max(1, parseInt(document.getElementById('settings-input-break')?.value, 10) || 5));

        try {
            await invokeTauri('atualizar_preferencias', { somAtivo, autoIniciarDescanso });
            const configAtualizada = await invokeTauri('atualizar_tempos', {
                tempoFocoMinutos: foco,
                tempoPausaMinutos: pausa
            });
            if (configAtualizada) {
                window.dispatchEvent(new CustomEvent('nostak:config-updated', { detail: configAtualizada }));
            }
            closeModal();
        } catch (err) {
            showSettingsFeedback('Erro ao salvar configurações: ' + err, true);
        }
    });
}

/**
 * TopAppBar unificado
 * <nostak-header></nostak-header>
 */
export class NostakHeader extends HTMLElement {
    connectedCallback() {
        this.render();
        ensureSettingsModalMounted();
        this.querySelector('#btn-header-settings')?.addEventListener('click', () => {
            openSettingsModal();
        });
    }

    render() {
        this.innerHTML = `
            <header class="w-full h-16 top-0 sticky bg-surface-container-low border-b border-outline-variant z-50 flex items-center justify-between px-4 md:px-8 transition-colors">
                <a href="index.html" class="flex items-center gap-3 group">
                    <img src="./logo_nostak.svg" alt="Logo Nostak" class="w-9 h-9 rounded-md border border-outline-variant/60 shrink-0 group-hover:scale-105 transition-transform duration-300" />
                    <span class="font-headline-md text-headline-md font-bold text-primary tracking-wide">Nostak</span>
                </a>
                <div class="flex items-center gap-4">
                    <button type="button" class="material-symbols-outlined text-on-surface-variant hover:text-primary hover:bg-surface-container-high p-2 rounded transition-colors" title="Configurações" aria-label="Abrir configurações da embarcação" id="btn-header-settings">
                        settings
                    </button>
                </div>
            </header>
        `;
    }
}

/**
 * Menu lateral unificado (sem a aba Diário)
 * <nostak-sidebar active="temporizador|jornada|listabloqueio"></nostak-sidebar>
 */
export class NostakSidebar extends HTMLElement {
    connectedCallback() {
        this.render();
        this.bindEvents();
    }

    static get observedAttributes() {
        return ['active'];
    }

    attributeChangedCallback() {
        this.render();
        this.bindEvents();
    }

    bindEvents() {
        this.querySelector('#btn-sidebar-settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            openSettingsModal();
        });
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
                <div class="mb-6 px-4 pt-2 flex items-center gap-3">
                    <img src="./logo_nostak.svg" alt="Logo Nostak" class="w-10 h-10 rounded-md border border-outline-variant/60 shrink-0" />
                    <div>
                        <h2 class="font-headline-md text-headline-md text-primary leading-none">Nostak</h2>
                        <p class="text-on-surface-variant font-label-sm text-label-sm mt-1 uppercase tracking-wider opacity-80">Navegando pelo Foco</p>
                    </div>
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
                </nav>
                <div class="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
                    <button type="button" id="btn-sidebar-settings" class="w-full text-left flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm">
                        <span class="material-symbols-outlined text-[20px]">tune</span> Configurações
                    </button>
                    <div class="pt-3 mt-1 border-t border-outline-variant/60 flex items-center justify-center gap-6">
                        <a class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-label-sm text-label-sm" href="https://nostak.app/" target="_blank" rel="noopener noreferrer" title="Site Oficial — nostak.app">
                            <span class="material-symbols-outlined text-[18px]">language</span>
                            <span>Site</span>
                        </a>
                        <a class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-label-sm text-label-sm" href="https://www.instagram.com/sallesfx" target="_blank" rel="noopener noreferrer" title="Instagram — @sallesfx">
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
 * Barra inferior mobile unificada (sem a aba Diário)
 * <nostak-mobile-nav active="temporizador|jornada|listabloqueio"></nostak-mobile-nav>
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
