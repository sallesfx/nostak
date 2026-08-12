let timerInterval = null;
let secondsRemaining = 1500; // 25:00

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
    const activeDisplay = document.getElementById('timer-display-active');
    if (activeDisplay) {
        activeDisplay.textContent = formatTime(secondsRemaining);
    }
}

async function startVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        // Envia lista vazia para utilizar os domínios configurados no config.toml do Rust
        const resposta = await invokeTauri('zarpar_jornada', { sites: [] });
        console.log("[Nostak]", resposta);

        if (container) {
            container.className = 'state-active bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Em Alto Mar';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }

        if (!timerInterval) {
            timerInterval = setInterval(() => {
                if (secondsRemaining > 0) {
                    secondsRemaining--;
                    updateTimerUI();
                } else {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    resetVoyage();
                }
            }, 1000);
        }
    } catch (erro) {
        console.error("[Nostak Error]", erro);
        alert("Atenção Navegador:\nNão foi possível erguer as velas e bloquear os sites.\n\nDetalhes: " + erro);

        if (badge) {
            badge.textContent = 'Erro de Permissão';
            badge.className = 'font-label-md text-label-md text-error uppercase tracking-widest px-2 py-1 border border-error bg-surface-container-low/80 backdrop-blur-sm';
        }
    }
}

async function pauseVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        const resposta = await invokeTauri('ancorar_porto_seguro');
        console.log("[Nostak]", resposta);

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        if (container) {
            container.className = 'state-paused bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        if (badge) {
            badge.textContent = 'Porto Seguro';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

async function failVoyage() {
    const container = document.getElementById('timer-container');
    const badge = document.getElementById('status-badge');

    try {
        const resposta = await invokeTauri('ancorar_porto_seguro');
        console.log("[Nostak]", resposta);

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

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

        secondsRemaining = 1500;
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

// Torna as funções disponíveis globalmente
window.startVoyage = startVoyage;
window.pauseVoyage = pauseVoyage;
window.failVoyage = failVoyage;
window.resetVoyage = resetVoyage;