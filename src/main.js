import { invokeTauri } from './ipc.js';
import { initTasks } from './tasks.js';
import { renderDashboardProgress } from './progress.js';

const TIMER_STORAGE_KEY = 'nostak_active_timer';
const DEFAULT_TITLE = 'Nostak - Navegando pelo Foco Profundo';

let timerInterval = null;
let focusMinutes = 25;
let breakMinutes = 5;
let currentPhase = 'idle'; // 'idle' | 'focus' | 'break' | 'paused'
let secondsRemaining = focusMinutes * 60;
let targetEndTimestamp = null;

/**
 * Toca um sino náutico suave sintetizado via Web Audio API (sem arquivos externos).
 */
function playNauticalBell(type = 'focus-end') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const notes = type === 'focus-end' ? [528, 792] : [660, 528];
        notes.forEach((freq, idx) => {
            const startTime = ctx.currentTime + idx * 0.35;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1.45);
        });
    } catch (e) {
        console.warn('[Nostak] Áudio indisponível:', e);
    }
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
        if (resumeBtn) resumeBtn.textContent = 'Pular Descanso';
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
            saveTimerSessionState();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            targetEndTimestamp = null;
            if (currentPhase === 'focus') {
                playNauticalBell('focus-end');
                startBreakSession();
            } else if (currentPhase === 'break') {
                playNauticalBell('break-end');
                finishBreakSession();
            }
        }
    }, 1000);
}

async function startVoyage() {
    const badge = document.getElementById('status-badge');

    try {
        // Envia lista vazia para utilizar os domínios configurados no config.toml do Rust
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

    } catch (erro) {
        console.error("[Nostak Error]", erro);
        alert("Atenção Navegador:\nNão foi possível erguer as velas e bloquear os sites.\n\nDetalhes: " + erro);

        if (badge) {
            badge.textContent = 'Erro de Permissão';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2.5 py-1 border border-error/50 bg-error-container/20 rounded-sm';
        }
    }
}

async function startBreakSession() {
    currentPhase = 'break';
    secondsRemaining = breakMinutes * 60;
    targetEndTimestamp = Date.now() + secondsRemaining * 1000;

    // Desbloqueia os sites para o descanso e registra a sessão de foco concluída
    try {
        await invokeTauri('ancorar_porto_seguro');
        const configAtualizada = await invokeTauri('registrar_sessao_concluida', {
            minutosFoco: focusMinutes
        });
        if (configAtualizada && configAtualizada.progresso) {
            renderDashboardProgress(configAtualizada.progresso);
        }
    } catch (e) {
        console.error("[Nostak] Erro ao finalizar foco e registrar sessão:", e);
    }

    applyPhaseVisualState('break');
    updateTimerUI();
    saveTimerSessionState();
    startCountdownLoop();
}

function finishBreakSession() {
    const badge = document.getElementById('status-badge');
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
        updateDocumentTitle();
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

async function initAppConfig() {
    const restored = tryRestoreActiveTimerSession();
    try {
        const config = await invokeTauri('obter_configuracoes');
        if (config) {
            if (!restored && config.tempo_foco_minutos) {
                focusMinutes = config.tempo_foco_minutos;
                breakMinutes = config.tempo_pausa_minutos || 5;
                secondsRemaining = focusMinutes * 60;
                updateTimerUI();
                updatePresetButtonsUI();
            }
            initTasks(config.tarefas || []);
            renderDashboardProgress(config.progresso || {});
        } else {
            initTasks([]);
            renderDashboardProgress({});
        }
    } catch (e) {
        console.error("[Nostak] Erro ao carregar configurações:", e);
        initTasks([]);
        renderDashboardProgress({});
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initAppConfig();

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
        if (modal) modal.classList.remove('hidden');
    };

    const closeCustomModal = () => {
        if (modal) modal.classList.add('hidden');
    };

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
