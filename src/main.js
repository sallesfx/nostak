import { invokeTauri, playNauticalBell } from './ipc.js';
import { initTasks, renderTasksState } from './tasks.js';
import { renderDashboardProgress } from './progress.js';
import { openModalDialog, closeModalDialog, bindModalKeyboardTrap, nostakAlert } from './components.js';

const TIMER_STORAGE_KEY = 'nostak_active_timer';
const DEFAULT_TITLE = 'Nostak - Navegando pelo Foco Profundo';

let timerInterval = null;
let focusMinutes = 25;
let breakMinutes = 5;
let somAtivo = true;
let autoIniciarDescanso = true;
let currentPhase = 'idle'; // 'idle' | 'focus' | 'break' | 'paused'
let secondsRemaining = focusMinutes * 60;
let targetEndTimestamp = null;

function announceStatus(message, priority = 'polite') {
    const el = document.getElementById('a11y-announcer');
    if (el) {
        el.setAttribute('aria-live', priority);
        el.textContent = '';
        // Breve timeout para disparar evento de acessibilidade do leitor de tela
        setTimeout(() => {
            el.textContent = message;
        }, 50);
    }
}

function focusElementSafe(elementId) {
    requestAnimationFrame(() => {
        const el = document.getElementById(elementId);
        if (el && typeof el.focus === 'function') {
            el.focus();
        }
    });
}

function saveTimerSessionState() {
    if (currentPhase === 'idle') {
        sessionStorage.removeItem(TIMER_STORAGE_KEY);
        return;
    }
    sessionStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
            currentPhase,
            secondsRemaining,
            targetEndTimestamp,
            focusMinutes,
            breakMinutes
        })
    );
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDocumentTitle() {
    const timeStr = formatTime(secondsRemaining);
    if (currentPhase === 'focus') {
        document.title = `[${timeStr}] Em Alto Mar • Nostak`;
    } else if (currentPhase === 'break') {
        document.title = `[${timeStr}] Porto Seguro • Nostak`;
    } else if (currentPhase === 'paused') {
        document.title = `[Pausado] Porto Seguro • Nostak`;
    } else {
        document.title = DEFAULT_TITLE;
    }
}

function updateTimerUI() {
    const timeStr = formatTime(secondsRemaining);
    const activeDisplay = document.getElementById('timer-display-active');
    const idleDisplay = document.getElementById('timer-display-idle');
    const pausedDisplay = document.getElementById('timer-display-paused');

    if (activeDisplay) activeDisplay.textContent = timeStr;
    if (idleDisplay && currentPhase === 'idle') idleDisplay.textContent = formatTime(focusMinutes * 60);
    if (pausedDisplay) {
        if (currentPhase === 'break') {
            pausedDisplay.textContent = timeStr;
            pausedDisplay.classList.remove('opacity-60');
        } else {
            pausedDisplay.textContent = 'Pausado';
            pausedDisplay.classList.add('opacity-60');
        }
    }
    updateDocumentTitle();
}

function updatePresetButtonsUI() {
    document.querySelectorAll('.btn-preset').forEach(btn => {
        const foco = parseInt(btn.getAttribute('data-foco'));
        const isSelected = foco === focusMinutes;
        btn.classList.toggle('border-primary', isSelected);
        btn.classList.toggle('bg-primary/10', isSelected);
        btn.classList.toggle('text-primary', isSelected);
        btn.classList.toggle('font-bold', isSelected);

        btn.classList.toggle('border-outline-variant', !isSelected);
        btn.classList.toggle('text-on-surface-variant', !isSelected);
    });
}

async function setTimerPreset(focoMin, pausaMin) {
    if (currentPhase === 'focus') return;

    focusMinutes = focoMin;
    breakMinutes = pausaMin;
    secondsRemaining = focusMinutes * 60;
    updateTimerUI();
    updatePresetButtonsUI();

    try {
        await invokeTauri('atualizar_tempos', {
            tempoFocoMinutos: focoMin,
            tempoPausaMinutos: pausaMin
        });
    } catch (e) {
        console.error("[Nostak] Erro ao salvar tempos:", e);
    }
}

function applyPhaseVisualState(phase) {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');
    const title = document.getElementById('paused-phase-title');
    const resumeBtn = document.getElementById('btn-resume-voyage');

    if (phase === 'focus') {
        if (container) {
            container.className = 'state-active bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }
        if (badge) {
            badge.textContent = 'Em Alto Mar';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2.5 py-1 border border-primary/50 bg-primary/10 rounded-sm';
        }
    } else if (phase === 'break') {
        if (container) {
            container.className = 'state-paused bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }
        if (badge) {
            badge.textContent = 'Porto Seguro (Descanso)';
            badge.className = 'font-label-md text-label-md text-secondary uppercase tracking-widest px-2.5 py-1 border border-secondary/40 bg-secondary-container/20 rounded-sm';
        }
        if (title) title.textContent = 'Descanso em Porto Seguro • Sites Liberados';
        if (resumeBtn) resumeBtn.textContent = 'Encerrar Pausa e Focar';
    } else if (phase === 'paused') {
        if (container) {
            container.className = 'state-paused bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }
        if (badge) {
            badge.textContent = 'Porto Seguro (Pausa)';
            badge.className = 'font-label-md text-label-md text-secondary uppercase tracking-widest px-2.5 py-1 border border-secondary/40 bg-secondary-container/20 rounded-sm';
        }
        if (title) title.textContent = 'Ancorado em Porto Seguro';
        if (resumeBtn) resumeBtn.textContent = 'Retomar Viagem';
    } else {
        if (container) {
            container.className = 'state-idle bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }
        if (badge) {
            badge.textContent = 'Aguardando';
            badge.className = 'font-label-md text-label-md text-secondary uppercase tracking-widest px-2.5 py-1 border border-secondary/40 bg-secondary-container/20 rounded-sm';
        }
    }
}

function startCountdownLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (targetEndTimestamp) {
            const diff = Math.max(0, Math.round((targetEndTimestamp - Date.now()) / 1000));
            secondsRemaining = diff;
        } else if (secondsRemaining > 0) {
            secondsRemaining--;
        }

        if (secondsRemaining > 0) {
            updateTimerUI();
            // Salva na storage apenas a cada 15 segundos para aliviar I/O síncrono da thread principal
            if (secondsRemaining % 15 === 0) {
                saveTimerSessionState();
            }
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            targetEndTimestamp = null;
            saveTimerSessionState();
            if (currentPhase === 'focus') {
                if (somAtivo) playNauticalBell('focus-end');
                completeFocusPhase();
            } else if (currentPhase === 'break') {
                if (somAtivo) playNauticalBell('break-end');
                finishBreakSession();
            }
        }
    }, 1000);
}

async function completeFocusPhase() {
    // Desbloqueia os sites e registra a sessão de foco concluída
    try {
        await invokeTauri('ancorar_porto_seguro');
        const configAtualizada = await invokeTauri('registrar_sessao_concluida', {
            minutosFoco: focusMinutes
        });
        if (configAtualizada) {
            if (configAtualizada.progresso) {
                renderDashboardProgress(configAtualizada.progresso);
            }
            renderTasksState(configAtualizada);
        }
    } catch (e) {
        console.error("[Nostak] Erro ao finalizar foco e registrar sessão:", e);
    }

    if (autoIniciarDescanso) {
        announceStatus(`Ciclo de foco concluído. Iniciando descanso de ${breakMinutes} minutos em Porto Seguro.`);
        startBreakSession();
    } else {
        announceStatus('Ciclo de foco concluído. Embarcação atracada e sites liberados.');
        finishBreakSession();
    }
}

async function startVoyage() {
    const badge = document.getElementById('status-badge');

    try {
        const resposta = await invokeTauri('zarpar_jornada', { sites: [] });
        console.log("[Nostak]", resposta);

        if (currentPhase === 'idle' || currentPhase === 'break') {
            secondsRemaining = focusMinutes * 60;
        }
        currentPhase = 'focus';
        targetEndTimestamp = Date.now() + secondsRemaining * 1000;

        applyPhaseVisualState('focus');
        updateTimerUI();
        saveTimerSessionState();
        startCountdownLoop();
        announceStatus(`Iniciando travessia em Alto Mar. Temporizador de foco ativo por ${focusMinutes} minutos.`);
        focusElementSafe('btn-pause-voyage');

    } catch (erro) {
        console.error("[Nostak Error]", erro);
        await nostakAlert({
            title: 'Atenção Navegador',
            message: 'Não foi possível erguer as velas e bloquear os sites.\n\nDetalhes: ' + erro,
            type: 'error'
        });

        if (badge) {
            badge.textContent = 'Erro de Permissão';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2.5 py-1 border border-error/50 bg-error-container/20 rounded-sm';
        }
    }
}

function startBreakSession() {
    currentPhase = 'break';
    secondsRemaining = breakMinutes * 60;
    targetEndTimestamp = Date.now() + secondsRemaining * 1000;

    applyPhaseVisualState('break');
    updateTimerUI();
    saveTimerSessionState();
    startCountdownLoop();
}

function finishBreakSession() {
    const badge = document.getElementById('status-badge');
    announceStatus('Período de descanso em Porto Seguro concluído. Embarcação pronta para zarpar.');
    resetVoyage().then(() => {
        if (badge) {
            badge.textContent = 'Viagem Concluída';
        }
    });
}

async function pauseVoyage() {
    try {
        await invokeTauri('ancorar_porto_seguro');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        targetEndTimestamp = null;
        currentPhase = 'paused';

        applyPhaseVisualState('paused');
        updateTimerUI();
        saveTimerSessionState();
        announceStatus('Embarcação ancorada em Porto Seguro. Temporizador pausado.');
        focusElementSafe('btn-resume-voyage');
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function failVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        await invokeTauri('ancorar_porto_seguro');
        const configAtualizada = await invokeTauri('registrar_sessao_interrompida');
        if (configAtualizada && configAtualizada.progresso) {
            renderDashboardProgress(configAtualizada.progresso);
        }

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        targetEndTimestamp = null;
        currentPhase = 'idle';
        saveTimerSessionState();

        if (container) {
            container.className = 'state-failed bg-surface-container-low border border-outline-variant rounded flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Interrompido';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2.5 py-1 border border-error/50 bg-error-container/20 rounded-sm';
        }
        if (somAtivo) {
            playNauticalBell('voyage-failed');
        }
        updateDocumentTitle();
        announceStatus('Foco interrompido. Bloqueios de sites desativados temporariamente.', 'assertive');
        focusElementSafe('btn-restart-voyage');
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function resetVoyage() {
    try {
        await invokeTauri('ancorar_porto_seguro');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        targetEndTimestamp = null;
        currentPhase = 'idle';
        secondsRemaining = focusMinutes * 60;
        saveTimerSessionState();

        applyPhaseVisualState('idle');
        updateTimerUI();
        announceStatus('Temporizador pronto. Escolha uma tarefa e inicie seu foco quando desejar.');
        focusElementSafe('btn-start-voyage');
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

function tryRestoreActiveTimerSession() {
    const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return false;

    try {
        const saved = JSON.parse(raw);
        if (!saved || !saved.currentPhase || saved.currentPhase === 'idle') return false;

        focusMinutes = saved.focusMinutes || focusMinutes;
        breakMinutes = saved.breakMinutes || breakMinutes;
        currentPhase = saved.currentPhase;

        if ((currentPhase === 'focus' || currentPhase === 'break') && saved.targetEndTimestamp) {
            targetEndTimestamp = saved.targetEndTimestamp;
            secondsRemaining = Math.max(0, Math.round((targetEndTimestamp - Date.now()) / 1000));
            applyPhaseVisualState(currentPhase);
            updatePresetButtonsUI();
            updateTimerUI();
            startCountdownLoop();
            return true;
        }

        if (currentPhase === 'paused') {
            secondsRemaining = saved.secondsRemaining || focusMinutes * 60;
            applyPhaseVisualState('paused');
            updatePresetButtonsUI();
            updateTimerUI();
            return true;
        }
    } catch (e) {
        console.warn('[Nostak] Falha ao restaurar sessão do timer:', e);
    }
    return false;
}

function applyConfigToTimer(config, preserveActiveTimer = true) {
    if (!config) return;
    somAtivo = config.som_ativo !== false;
    autoIniciarDescanso = config.auto_iniciar_descanso !== false;

    if ((!preserveActiveTimer || currentPhase === 'idle') && config.tempo_foco_minutos) {
        focusMinutes = config.tempo_foco_minutos;
        breakMinutes = config.tempo_pausa_minutos || 5;
        secondsRemaining = focusMinutes * 60;
        updateTimerUI();
        updatePresetButtonsUI();
    }
    if (config.progresso) {
        renderDashboardProgress(config.progresso);
    }
}

async function initAppConfig() {
    const restored = tryRestoreActiveTimerSession();
    try {
        const config = await invokeTauri('obter_configuracoes');
        if (config) {
            applyConfigToTimer(config, restored);
            initTasks(config);
        } else {
            initTasks({});
            renderDashboardProgress({});
        }
    } catch (e) {
        console.error("[Nostak] Erro ao carregar configurações:", e);
        initTasks({});
        renderDashboardProgress({});
    }
}

// Escuta atualizações vindas do Modal Global de Configurações
window.addEventListener('nostak:config-updated', (e) => {
    if (e.detail) {
        applyConfigToTimer(e.detail, true);
    }
});

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initAppConfig();

    // Controles principais da viagem / temporizador
    document.getElementById('btn-start-voyage')?.addEventListener('click', startVoyage);
    document.getElementById('btn-pause-voyage')?.addEventListener('click', pauseVoyage);
    document.getElementById('btn-fail-voyage')?.addEventListener('click', failVoyage);
    document.getElementById('btn-resume-voyage')?.addEventListener('click', startVoyage);
    document.getElementById('btn-abort-paused-voyage')?.addEventListener('click', resetVoyage);
    document.getElementById('btn-restart-voyage')?.addEventListener('click', resetVoyage);

    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const foco = parseInt(e.currentTarget.getAttribute('data-foco'));
            const pausa = parseInt(e.currentTarget.getAttribute('data-pausa'));
            setTimerPreset(foco, pausa);
        });
    });

    // Elementos do Modal de Personalização
    const modal = document.getElementById('modal-custom-timer');
    const btnOpenModal = document.getElementById('btn-open-custom-timer');
    const btnCloseModal = document.getElementById('btn-close-custom-timer');
    const btnCancelModal = document.getElementById('btn-cancel-custom-timer');
    const formCustomTimer = document.getElementById('form-custom-timer');
    const inputFocus = document.getElementById('input-custom-focus');
    const inputBreak = document.getElementById('input-custom-break');
    const btnFocusMinus = document.getElementById('btn-focus-minus');
    const btnFocusPlus = document.getElementById('btn-focus-plus');
    const btnBreakMinus = document.getElementById('btn-break-minus');
    const btnBreakPlus = document.getElementById('btn-break-plus');

    const openCustomModal = () => {
        if (inputFocus) inputFocus.value = focusMinutes;
        if (inputBreak) inputBreak.value = breakMinutes;
        if (modal) openModalDialog(modal, '#input-custom-focus');
    };

    const closeCustomModal = () => {
        if (modal) closeModalDialog(modal);
    };

    if (modal) {
        bindModalKeyboardTrap(modal, closeCustomModal);
    }

    if (btnOpenModal) btnOpenModal.addEventListener('click', openCustomModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeCustomModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeCustomModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCustomModal();
        });
    }

    if (btnFocusMinus && inputFocus) {
        btnFocusMinus.addEventListener('click', () => {
            const cur = parseInt(inputFocus.value) || 25;
            inputFocus.value = Math.max(1, cur - 5);
        });
    }
    if (btnFocusPlus && inputFocus) {
        btnFocusPlus.addEventListener('click', () => {
            const cur = parseInt(inputFocus.value) || 25;
            inputFocus.value = Math.min(180, cur + 5);
        });
    }
    if (btnBreakMinus && inputBreak) {
        btnBreakMinus.addEventListener('click', () => {
            const cur = parseInt(inputBreak.value) || 5;
            inputBreak.value = Math.max(1, cur - 1);
        });
    }
    if (btnBreakPlus && inputBreak) {
        btnBreakPlus.addEventListener('click', () => {
            const cur = parseInt(inputBreak.value) || 5;
            inputBreak.value = Math.min(60, cur + 1);
        });
    }

    if (formCustomTimer) {
        formCustomTimer.addEventListener('submit', (e) => {
            e.preventDefault();
            const f = parseInt(inputFocus?.value) || 25;
            const p = parseInt(inputBreak?.value) || 5;
            setTimerPreset(Math.min(180, Math.max(1, f)), Math.min(60, Math.max(1, p)));
            closeCustomModal();
        });
    }
});

// Torna as funções disponíveis globalmente para handlers inline
window.invokeTauri = invokeTauri;
window.startVoyage = startVoyage;
window.pauseVoyage = pauseVoyage;
window.failVoyage = failVoyage;
window.resetVoyage = resetVoyage;
window.setTimerPreset = setTimerPreset;
