const { invoke } = window.__TAURI__.core;

async function startVoyage() {
    try {
        // Exemplo de sites/Sereias configuradas para bloqueio no hosts
        const sites = ["instagram.com", "twitter.com", "facebook.com", "youtube.com"];

        const resposta = await invoke('zarpar_jornada', { sites });
        console.log("[Nostak]", resposta);

        // Atualiza a interface gráfica para o estado "Em Alto Mar"
        const container = document.getElementById('timer-container');
        if (container) {
            container.className = 'state-active bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        const badge = document.getElementById('status-badge');
        if (badge) {
            badge.textContent = 'Em Alto Mar';
            badge.className = 'font-label-md text-label-md text-primary uppercase tracking-widest px-2 py-1 border border-primary bg-surface-container-low/80 backdrop-blur-sm';
        }

    } catch (erro) {
        alert("Atenção Navegador: " + erro);
    }
}

async function pauseVoyage() {
    try {
        const resposta = await invoke('ancorar_porto_seguro');
        console.log("[Nostak]", resposta);

        const container = document.getElementById('timer-container');
        if (container) {
            container.className = 'state-paused bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-all duration-500';
        }

        const badge = document.getElementById('status-badge');
        if (badge) {
            badge.textContent = 'Porto Seguro';
        }
    } catch (erro) {
        console.error("[Nostak Error]", erro);
    }
}

window.startVoyage = startVoyage;
window.pauseVoyage = pauseVoyage;