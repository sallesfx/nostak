import { invokeTauri } from './ipc.js';
import { nostakAlert } from './components.js';

export function renderConfiguracoes(config) {
    if (!config) return;

    // Atualiza os interruptores das categorias
    const ativas = config.categorias_ativas || [];
    document.querySelectorAll('[data-category]').forEach(card => {
        const catId = card.getAttribute('data-category');
        const input = card.querySelector('.toggle-input');
        const statusLabel = card.querySelector('.category-status');
        const isAtiva = ativas.includes(catId);

        if (input) input.checked = isAtiva;
        if (statusLabel) {
            statusLabel.textContent = isAtiva ? 'Ativado' : 'Desativado';
            statusLabel.classList.toggle('text-on-surface-variant', !isAtiva);
            statusLabel.classList.toggle('text-primary', isAtiva);
        }
    });

    // Atualiza as sereias personalizadas
    const sites = config.sites_personalizados || [];
    const countBadge = document.getElementById('custom-sites-count');
    const listContainer = document.getElementById('custom-sites-list');
    const emptyState = document.getElementById('custom-sites-empty');

    if (countBadge) {
        countBadge.textContent = `${sites.length} ${sites.length === 1 ? 'Ativo' : 'Ativos'}`;
    }

    if (listContainer) {
        listContainer.innerHTML = '';
        if (sites.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            sites.forEach(site => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-sm px-4 py-3 group hover:border-outline transition-colors';
                item.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <span class="material-symbols-outlined text-secondary text-xl">block</span>
                        <span class="font-body-md text-sm text-on-surface truncate">${site}</span>
                    </div>
                    <button class="btn-remove-site text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 transition-colors rounded-sm" data-site="${site}" title="Remover Sereia">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                `;
                listContainer.appendChild(item);
            });
        }
    }
}

async function carregarConfiguracoes() {
    try {
        const config = await invokeTauri('obter_configuracoes');
        if (config) {
            renderConfiguracoes(config);
        }
    } catch (e) {
        console.error('[Nostak] Erro ao obter configurações:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();

    // Alternância de categorias
    document.querySelectorAll('[data-category] .toggle-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const card = e.target.closest('[data-category]');
            const catId = card.getAttribute('data-category');
            const ativa = e.target.checked;
            const statusLabel = card.querySelector('.category-status');

            if (statusLabel) {
                statusLabel.textContent = ativa ? 'Ativado' : 'Desativado';
                statusLabel.classList.toggle('text-on-surface-variant', !ativa);
                statusLabel.classList.toggle('text-primary', ativa);
            }

            try {
                const configAtualizada = await invokeTauri('alternar_categoria', { categoria: catId, ativa });
                if (configAtualizada) {
                    renderConfiguracoes(configAtualizada);
                }
            } catch (err) {
                console.error(`[Nostak] Erro ao alternar categoria ${catId}:`, err);
                e.target.checked = !ativa;
            }
        });
    });

    // Adicionar novo site
    const formAdd = document.getElementById('form-add-sereia');
    const inputSite = document.getElementById('input-new-sereia');
    if (formAdd && inputSite) {
        formAdd.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rawSite = inputSite.value.trim().toLowerCase();
            if (!rawSite) return;

            const cleanSite = rawSite.replace(/^https?:\/\//, '').split('/')[0].trim();
            if (!cleanSite) return;

            try {
                const configAtualizada = await invokeTauri('adicionar_sereia', { site: cleanSite });
                inputSite.value = '';
                if (configAtualizada) {
                    renderConfiguracoes(configAtualizada);
                }
            } catch (err) {
                await nostakAlert({
                    title: 'Lista de Bloqueio',
                    message: 'Não foi possível adicionar a Sereia: ' + err,
                    type: 'error'
                });
            }
        });
    }

    // Remover site
    const listContainer = document.getElementById('custom-sites-list');
    if (listContainer) {
        listContainer.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-remove-site');
            if (!btn) return;

            const site = btn.getAttribute('data-site');
            if (!site) return;

            try {
                const configAtualizada = await invokeTauri('remover_sereia', { site });
                if (configAtualizada) {
                    renderConfiguracoes(configAtualizada);
                }
            } catch (err) {
                await nostakAlert({
                    title: 'Lista de Bloqueio',
                    message: 'Não foi possível remover a Sereia: ' + err,
                    type: 'error'
                });
            }
        });
    }
});

