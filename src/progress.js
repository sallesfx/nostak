import { invokeTauri } from './ipc.js';

/**
 * Calcula o setor marítimo atual e a coordenada no SVG com base nas milhas (minutos focados).
 */
function getMaritimeSector(miles) {
    if (miles >= 600) {
        return { name: 'Setor 05: Arquipélago da Maestria', x: 750, y: 50 };
    }
    if (miles >= 360) {
        return { name: 'Setor 04: Mar de Silêncio', x: 550, y: 80 };
    }
    if (miles >= 180) {
        return { name: 'Setor 03: Águas de Bronze', x: 400, y: 50 };
    }
    if (miles >= 60) {
        return { name: 'Setor 02: Estreito da Disciplina', x: 250, y: 20 };
    }
    return { name: 'Setor 01: Baía da Partida', x: 90, y: 42 };
}

/**
 * Atualiza o painel lateral "Status da Viagem" e os cards rápidos na index.html
 */
export function renderDashboardProgress(progresso = {}) {
    const totalMinutos = progresso.total_minutos_foco || 0;
    const concluidas = progresso.sessoes_concluidas || 0;
    const interrompidas = progresso.sessoes_interrompidas || 0;
    const totalTentativas = concluidas + interrompidas;

    // 1. Combustível Mental (baseado na taxa de conclusão sem abandono)
    const fuelPercent = totalTentativas === 0
        ? 100
        : Math.max(15, Math.round((concluidas / totalTentativas) * 100));

    const fuelLabel = document.getElementById('metric-fuel-label');
    const fuelBar = document.getElementById('metric-fuel-bar');
    if (fuelLabel) fuelLabel.textContent = `${fuelPercent}%`;
    if (fuelBar) fuelBar.style.width = `${fuelPercent}%`;

    // 2. Distância Percorrida (meta de ciclo de 120nm por setor)
    const distLabel = document.getElementById('metric-distance-label');
    const distBar = document.getElementById('metric-distance-bar');
    const sectorProgress = totalMinutos === 0 ? 0 : Math.min(100, Math.round(((totalMinutos % 120) || 120) / 120 * 100));
    if (distLabel) distLabel.textContent = `${totalMinutos}nm`;
    if (distBar) distBar.style.width = `${sectorProgress}%`;

    // 3. Vento de Popa (estabilidade de foco)
    const windLabel = document.getElementById('metric-wind-label');
    const windBar = document.getElementById('metric-wind-bar');
    let windText = 'Calmo';
    let windWidth = 50;

    if (totalTentativas > 0) {
        if (fuelPercent >= 85) {
            windText = 'Forte';
            windWidth = 95;
        } else if (fuelPercent >= 60) {
            windText = 'Estável';
            windWidth = 75;
        } else {
            windText = 'Turbulento';
            windWidth = 35;
        }
    }
    if (windLabel) windLabel.textContent = windText;
    if (windBar) windBar.style.width = `${windWidth}%`;

    // 4. Cards de Estatísticas Rápidas (Horas Foco & Total de Milhas)
    const statHours = document.getElementById('stat-hours-total');
    const statMiles = document.getElementById('stat-miles-total');
    if (statHours) {
        const hours = (totalMinutos / 60).toFixed(1);
        statHours.textContent = `${hours.endsWith('.0') ? hours.slice(0, -2) : hours}h`;
    }
    if (statMiles) {
        statMiles.textContent = `${totalMinutos}`;
    }
}

/**
 * Atualiza a página "A Jornada do Navegador" (jornada.html)
 */
export function renderJourneyPage(progresso = {}) {
    const totalMinutos = progresso.total_minutos_foco || 0;
    const concluidas = progresso.sessoes_concluidas || 0;
    const maiorSessao = progresso.maior_sessao_minutos || 0;
    const sereias = progresso.sereias_silenciadas || 0;

    // 1. Setor e Posição no Mapa SVG
    const sector = getMaritimeSector(totalMinutos);
    const sectorEl = document.getElementById('journey-sector-name');
    if (sectorEl) sectorEl.textContent = sector.name;

    const markerRect = document.getElementById('journey-map-marker');
    const markerCircle = document.getElementById('journey-map-circle');
    const markerLabel = document.getElementById('journey-map-label');
    if (markerRect) {
        markerRect.setAttribute('x', String(sector.x - 8));
        markerRect.setAttribute('y', String(sector.y - 8));
    }
    if (markerCircle) {
        markerCircle.setAttribute('cx', String(sector.x));
        markerCircle.setAttribute('cy', String(sector.y));
    }
    if (markerLabel) {
        markerLabel.setAttribute('x', String(sector.x + 15));
        markerLabel.setAttribute('y', String(sector.y + 15));
    }

    // 2. Contadores Principais (Léguas Percorridas e Sereias Silenciadas)
    const milesEl = document.getElementById('journey-total-miles');
    const sirensEl = document.getElementById('journey-total-sirens');
    if (milesEl) {
        milesEl.innerHTML = `${totalMinutos.toLocaleString('pt-BR')} <span class="text-headline-sm font-headline-sm opacity-60">nm</span>`;
    }
    if (sirensEl) {
        sirensEl.innerHTML = `${sirens.toLocaleString('pt-BR')} <span class="text-headline-sm font-headline-sm opacity-60">distrações</span>`;
    }

    // 3. Conquista 1: Âncora de Aço (Meta: sessão ininterrupta de 90 min)
    const anchorBadge = document.getElementById('mastery-anchor-badge');
    const anchorBar = document.getElementById('mastery-anchor-bar');
    const anchorMeta = document.getElementById('mastery-anchor-meta');
    const anchorPct = Math.min(100, Math.round((maiorSessao / 90) * 100));
    const anchorLvl = maiorSessao >= 90 ? 'COMPLETO' : `NÍVEL ${Math.min(4, Math.floor(maiorSessao / 20) + (maiorSessao > 0 ? 1 : 0))}`;
    if (anchorBadge) anchorBadge.textContent = anchorLvl;
    if (anchorBar) anchorBar.style.width = `${anchorPct}%`;
    if (anchorMeta) anchorMeta.textContent = `Recorde atual: ${maiorSessao} / 90 min`;

    // 4. Conquista 2: Visão de Horizonte (Meta: 50 sereias silenciadas)
    const horizonBadge = document.getElementById('mastery-horizon-badge');
    const horizonBar = document.getElementById('mastery-horizon-bar');
    const horizonMeta = document.getElementById('mastery-horizon-meta');
    const horizonPct = Math.min(100, Math.round((sereias / 50) * 100));
    const horizonLvl = sereias >= 50 ? 'COMPLETO' : `NÍVEL ${Math.min(4, Math.floor(sereias / 12) + (sereias > 0 ? 1 : 0))}`;
    if (horizonBadge) horizonBadge.textContent = horizonLvl;
    if (horizonBar) horizonBar.style.width = `${horizonPct}%`;
    if (horizonMeta) horizonMeta.textContent = `${sereias} / 50 distrações bloqueadas`;

    // 5. Conquista 3: Navegador Mestre (Meta: 10 viagens concluídas)
    const masterBadge = document.getElementById('mastery-master-badge');
    const masterBar = document.getElementById('mastery-master-bar');
    const masterMeta = document.getElementById('mastery-master-meta');
    const masterPct = Math.min(100, Math.round((concluidas / 10) * 100));
    const masterLvl = concluidas >= 10 ? 'COMPLETO' : `NÍVEL ${Math.min(4, Math.floor(concluidas / 2) + (concluidas > 0 ? 1 : 0))}`;
    if (masterBadge) masterBadge.textContent = masterLvl;
    if (masterBar) masterBar.style.width = `${masterPct}%`;
    if (masterMeta) masterMeta.textContent = `${concluidas} / 10 viagens concluídas`;
}

// Se estivermos na página jornada.html, carrega automaticamente ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('journey-total-miles')) {
        try {
            const config = await invokeTauri('obter_configuracoes');
            if (config && config.progresso) {
                renderJourneyPage(config.progresso);
            } else {
                renderJourneyPage({});
            }
        } catch (e) {
            console.error('[Nostak] Erro ao carregar progresso da jornada:', e);
        }
    }
});

