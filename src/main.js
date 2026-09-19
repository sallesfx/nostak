let timerInterval = null;
let focusMinutes = 25;
let breakMinutes = 5;
let currentPhase = 'idle'; // 'idle' | 'focus' | 'break' | 'paused'
let secondsRemaining = focusMinutes * 60;

// Helper seguro para chamadas Tauri IPC
async function invokeTauri(cmd, args = {}) {
    if (window.__TAURI__) {
        const invokeFn = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
        if (typeof invokeFn === 'function') {
            return await invokeFn(cmd, args);
        }
    }
    console.warn(`[Nostak Simulation] Tauri IPC não detectado. Executando ${cmd}`, args);
    return `[Simulado] Comando ${cmd} executado.`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

async function startVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        // Envia lista vazia para utilizar os domínios configurados no config.toml do Rust
        const resposta = await invokeTauri('zarpar_jornada', { sites: [] });
        console.log("[Nostak]", resposta);

        if (currentPhase === 'idle') {
            secondsRemaining = focusMinutes * 60;
        }
        currentPhase = 'focus';

        if (container) {
            container.className = 'state-active bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Em Alto Mar';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }

        updateTimerUI();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (secondsRemaining > 0) {
                secondsRemaining--;
                updateTimerUI();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                startBreakSession();
            }
        }, 1000);

    } catch (erro) {
        console.error("[Nostak Error]", erro);
        alert("Atenção Navegador:\nNão foi possível erguer as velas e bloquear os sites.\n\nDetalhes: " + erro);

        if (badge) {
            badge.textContent = 'Erro de Permissão';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2 py-1 border border-error bg-surface-container-low/80 backdrop-blur-sm';
        }
    }
}

async function startBreakSession() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');
    const title = document.getElementById('paused-phase-title');
    const resumeBtn = document.getElementById('btn-resume-voyage');

    currentPhase = 'break';
    secondsRemaining = breakMinutes * 60;

    // Desbloqueia os sites para o descanso
    try {
        await invokeTauri('ancorar_porto_seguro');
    } catch (e) {
        console.error("[Nostak] Erro ao liberar sites para o descanso:", e);
    }

    if (container) {
        container.className = 'state-paused bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
    }

    if (badge) {
        badge.textContent = 'Porto Seguro (Descanso)';
        badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
    }

    if (title) {
        title.textContent = 'Descanso em Porto Seguro • Sites Liberados';
    }

    if (resumeBtn) {
        resumeBtn.textContent = 'Pular Descanso';
    }

    updateTimerUI();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (secondsRemaining > 0) {
            secondsRemaining--;
            updateTimerUI();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            finishBreakSession();
        }
    }, 1000);
}

function finishBreakSession() {
    const badge = document.getElementById('status-badge');
    resetVoyage();
    if (badge) {
        badge.textContent = 'Viagem Concluída';
    }
}

async function pauseVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');
    const title = document.getElementById('paused-phase-title');
    const resumeBtn = document.getElementById('btn-resume-voyage');

    try {
        await invokeTauri('ancorar_porto_seguro');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        currentPhase = 'paused';

        if (container) {
            container.className = 'state-paused bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Porto Seguro (Pausa)';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }

        if (title) {
            title.textContent = 'Ancorado em Porto Seguro';
        }

        if (resumeBtn) {
            resumeBtn.textContent = 'Retomar Viagem';
        }

        updateTimerUI();
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function failVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        await invokeTauri('ancorar_porto_seguro');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        currentPhase = 'idle';

        if (container) {
            container.className = 'state-failed bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Interrompido';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2 py-1 border border-error bg-surface-container-low/80 backdrop-blur-sm';
        }
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function resetVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        await invokeTauri('ancorar_porto_seguro');

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        currentPhase = 'idle';
        secondsRemaining = focusMinutes * 60;
        updateTimerUI();

        if (container) {
            container.className = 'state-idle bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Aguardando';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function initTimerConfig() {
    try {
        const config = await invokeTauri('obter_configuracoes');
        if (config && config.tempo_foco_minutos) {
            focusMinutes = config.tempo_foco_minutos;
            breakMinutes = config.tempo_pausa_minutos || 5;
            secondsRemaining = focusMinutes * 60;
            updateTimerUI();
            updatePresetButtonsUI();
        }
    } catch (e) {
        console.error("[Nostak] Erro ao carregar configurações de tempo:", e);
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initTimerConfig();

    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const foco = parseInt(e.currentTarget.getAttribute('data-foco'));
            const pausa = parseInt(e.currentTarget.getAttribute('data-pausa'));
            setTimerPreset(foco, pausa);
        });
    });
});

// Torna as funções disponíveis globalmente
window.invokeTauri = invokeTauri;
window.startVoyage = startVoyage;
window.pauseVoyage = pauseVoyage;
window.failVoyage = failVoyage;
window.resetVoyage = resetVoyage;
window.setTimerPreset = setTimerPreset;