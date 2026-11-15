import { invokeTauri } from './ipc.js';
import { t, getLanguage } from './i18n.js';

let lastRenderedProgress = null;

/**
 * Calcula o setor marítimo atual e a coordenada no SVG com base nas milhas (minutos focados).
 */
function getMaritimeSector(miles) {
    if (miles >= 600) {
        return { name: t('journey.sector_5'), x: 750, y: 50 };
    }
    if (miles >= 360) {
        return { name: t('journey.sector_4'), x: 550, y: 80 };
    }
    if (miles >= 180) {
        return { name: t('journey.sector_3'), x: 400, y: 50 };
    }
    if (miles >= 60) {
        return { name: t('journey.sector_2'), x: 250, y: 20 };
    }
    return { name: t('journey.sector_1'), x: 90, y: 42 };
}

/**
 * Atualiza o painel lateral "Status da Viagem" e os cards rápidos na index.html
 */
export function renderDashboardProgress(progresso = {}) {
    lastRenderedProgress = progresso;
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
    const fuelProgressbar = document.getElementById('progressbar-fuel');
    if (fuelLabel) fuelLabel.textContent = `${fuelPercent}%`;
    if (fuelBar) fuelBar.style.width = `${fuelPercent}%`;
    if (fuelProgressbar) {
        fuelProgressbar.setAttribute('aria-valuenow', String(fuelPercent));
        fuelProgressbar.setAttribute('aria-valuetext', t('metrics.fuel_valuetext', { value: fuelPercent }));
    }

    // 2. Distância Percorrida (meta de ciclo de 120nm por setor)
    const distLabel = document.getElementById('metric-distance-label');
    const distBar = document.getElementById('metric-distance-bar');
    const distProgressbar = document.getElementById('progressbar-distance');
    const sectorProgress = totalMinutos === 0 ? 0 : Math.min(100, Math.round(((totalMinutos % 120) || 120) / 120 * 100));
    if (distLabel) distLabel.textContent = `${totalMinutos}nm`;
    if (distBar) distBar.style.width = `${sectorProgress}%`;
    if (distProgressbar) {
        distProgressbar.setAttribute('aria-valuenow', String(sectorProgress));
        distProgressbar.setAttribute('aria-valuetext', t('metrics.distance_valuetext', { value: totalMinutos }));
    }

    // 3. Vento de Popa (estabilidade de foco)
    const windLabel = document.getElementById('metric-wind-label');
    const windBar = document.getElementById('metric-wind-bar');
    const windProgressbar = document.getElementById('progressbar-wind');
    let windText = t('metrics.wind_calm');
    let windWidth = 50;

    if (totalTentativas > 0) {
        if (fuelPercent >= 85) {
            windText = t('metrics.wind_strong');
            windWidth = 95;
        } else if (fuelPercent >= 60) {
            windText = t('metrics.wind_steady');
            windWidth = 75;
        } else {
            windText = t('metrics.wind_calm');
            windWidth = 35;
        }
    }
    if (windLabel) windLabel.textContent = windText;
    if (windBar) windBar.style.width = `${windWidth}%`;
    if (windProgressbar) {
        windProgressbar.setAttribute('aria-valuenow', String(windWidth));
        windProgressbar.setAttribute('aria-valuetext', `${t('metrics.wind')}: ${windText}`);
    }

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
    lastRenderedProgress = progresso;
    const totalMinutos = progresso.total_minutos_foco || 0;
    const concluidas = progresso.sessoes_concluidas || 0;
    const maiorSessao = progresso.maior_sessao_minutos || 0;
    const sereias = progresso.sereias_silenciadas || 0;
    const isEn = getLanguage() === 'en';

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
        markerLabel.textContent = t('journey.marker_you');
    }

    // 2. Contadores Principais (Milhas Náuticas de Foco e Distrações Bloqueadas)
    const milesEl = document.getElementById('journey-total-miles');
    const sirensEl = document.getElementById('journey-total-sirens');
    const locale = isEn ? 'en-US' : 'pt-BR';
    if (milesEl) {
        milesEl.innerHTML = `${totalMinutos.toLocaleString(locale)} <span class="text-headline-sm font-headline-sm opacity-60">${t('journey.unit_min')}</span>`;
    }
    if (sirensEl) {
        sirensEl.innerHTML = `${sereias.toLocaleString(locale)} <span class="text-headline-sm font-headline-sm opacity-60">${t('journey.unit_sirens')}</span>`;
    }

    // 3. Conquista 1: Âncora de Aço (Meta: sessão ininterrupta de 90 min)
    const anchorBadge = document.getElementById('mastery-anchor-badge');
    const anchorBar = document.getElementById('mastery-anchor-bar');
    const anchorProgressbar = document.getElementById('progressbar-mastery-anchor');
    const anchorMeta = document.getElementById('mastery-anchor-meta');
    const anchorPct = Math.min(100, Math.round((maiorSessao / 90) * 100));
    const anchorLvl = maiorSessao >= 90 ? (isEn ? 'COMPLETE' : 'COMPLETO') : t('journey.badge_level', { level: Math.min(4, Math.floor(maiorSessao / 20) + (maiorSessao > 0 ? 1 : 0)) });
    if (anchorBadge) anchorBadge.textContent = anchorLvl;
    if (anchorBar) anchorBar.style.width = `${anchorPct}%`;
    if (anchorProgressbar) {
        const val = Math.min(90, maiorSessao);
        anchorProgressbar.setAttribute('aria-valuenow', String(val));
        anchorProgressbar.setAttribute('aria-valuetext', `${maiorSessao} / 90 ${t('journey.unit_min')}`);
    }
    if (anchorMeta) anchorMeta.textContent = t('journey.card1_meta', { curr: maiorSessao });

    // 4. Conquista 2: Canto Silenciado (Meta: 50 sereias silenciadas)
    const horizonBadge = document.getElementById('mastery-horizon-badge');
    const horizonBar = document.getElementById('mastery-horizon-bar');
    const horizonProgressbar = document.getElementById('progressbar-mastery-horizon');
    const horizonMeta = document.getElementById('mastery-horizon-meta');
    const horizonPct = Math.min(100, Math.round((sereias / 50) * 100));
    const horizonLvl = sereias >= 50 ? (isEn ? 'COMPLETE' : 'COMPLETO') : t('journey.badge_level', { level: Math.min(4, Math.floor(sereias / 12) + (sereias > 0 ? 1 : 0)) });
    if (horizonBadge) horizonBadge.textContent = horizonLvl;
    if (horizonBar) horizonBar.style.width = `${horizonPct}%`;
    if (horizonProgressbar) {
        const val = Math.min(50, sereias);
        horizonProgressbar.setAttribute('aria-valuenow', String(val));
        horizonProgressbar.setAttribute('aria-valuetext', `${sereias} / 50 ${t('journey.unit_sirens')}`);
    }
    if (horizonMeta) horizonMeta.textContent = t('journey.card2_meta', { curr: sereias });

    // 5. Conquista 3: Navegador Mestre (Meta: 10 viagens concluídas)
    const masterBadge = document.getElementById('mastery-master-badge');
    const masterBar = document.getElementById('mastery-master-bar');
    const masterProgressbar = document.getElementById('progressbar-mastery-master');
    const masterMeta = document.getElementById('mastery-master-meta');
    const masterPct = Math.min(100, Math.round((concluidas / 10) * 100));
    const masterLvl = concluidas >= 10 ? (isEn ? 'COMPLETE' : 'COMPLETO') : t('journey.badge_level', { level: Math.min(4, Math.floor(concluidas / 2) + (concluidas > 0 ? 1 : 0)) });
    if (masterBadge) masterBadge.textContent = masterLvl;
    if (masterBar) masterBar.style.width = `${masterPct}%`;
    if (masterProgressbar) {
        const val = Math.min(10, concluidas);
        masterProgressbar.setAttribute('aria-valuenow', String(val));
        masterProgressbar.setAttribute('aria-valuetext', `${concluidas} / 10`);
    }
    if (masterMeta) masterMeta.textContent = t('journey.card3_meta', { curr: concluidas });
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

        // Micro-interação para os cards de maestria
        document.querySelectorAll('.bg-surface-container-low').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('border-primary');
                card.style.transform = 'translateY(-2px)';
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('border-primary');
                card.style.transform = 'translateY(0px)';
            });
            card.style.transition = 'all 0.15s ease-out';
        });
    }
});

// Atualiza em tempo real caso o usuário zere o progresso pelo Modal Global de Configurações
window.addEventListener('nostak:config-updated', (e) => {
    if (e.detail && e.detail.progresso) {
        if (document.getElementById('journey-total-miles')) {
            renderJourneyPage(e.detail.progresso);
        }
        renderDashboardProgress(e.detail.progresso);
    }
});

// Atualiza em tempo real ao alterar o idioma
window.addEventListener('nostak:language-changed', () => {
    if (lastRenderedProgress) {
        if (document.getElementById('journey-total-miles')) {
            renderJourneyPage(lastRenderedProgress);
        }
        renderDashboardProgress(lastRenderedProgress);
    }
});

