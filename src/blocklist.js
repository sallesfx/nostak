import { invokeTauri } from './ipc.js';
import { nostakAlert } from './components.js';

let currentSites = [];

function sanitizeDomain(raw) {
    if (!raw) return '';
    return raw
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .split('?')[0]
        .split('#')[0]
        .replace(/\.+$/, '') // Remove pontos finais à direita digitados por engano
        .trim();
}

function validateDomain(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
        return 'Informe o domínio do site que deseja silenciar.';
    }
    const clean = sanitizeDomain(trimmed);
    if (!clean) {
        return 'Endereço de domínio inválido.';
    }
    if (clean.includes(' ')) {
        return 'O domínio não pode conter espaços.';
    }
    // Exige TLD final alfabético com pelo menos 2 caracteres (ex: .com, .br, .tech, .globo)
    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(clean)) {
        return 'Informe um domínio válido (ex.: reddit.com, anime.tv ou gshow.globo.com).';
    }
    if (currentSites.includes(clean)) {
        return `O domínio "${clean}" já está silenciado na lista de Sereias.`;
    }
    return null;
}

export function renderConfiguracoes(config) {
    if (!config) return;

    // Atualiza os interruptores das categorias
    const ativas = config.categorias_ativas || [];
    document.querySelectorAll('[data-category]').forEach(card => {
        const catId = card.getAttribute('data-category');
        const input = card.querySelector('.toggle-input');
        const statusLabel = card.querySelector('.category-status');
        const isAtiva = ativas.includes(catId);

        if (input) {
            input.checked = isAtiva;
            input.setAttribute('aria-checked', String(isAtiva));
        }
        if (statusLabel) {
            statusLabel.textContent = isAtiva ? 'Ativado' : 'Desativado';
            statusLabel.classList.toggle('text-on-surface-variant', !isAtiva);
            statusLabel.classList.toggle('text-primary', isAtiva);
        }
    });

    // Atualiza as sereias personalizadas
    const sites = config.sites_personalizados || [];
    currentSites = sites.map(s => s.toLowerCase());
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
                    <button class="btn-remove-site text-on-surface-variant hover:text-error hover:bg-error/10 w-7 h-7 flex items-center justify-center transition-colors rounded-sm shrink-0" data-site="${site}" title="Remover Sereia" aria-label="Remover sereia ${site} da lista de bloqueio">
                        <span class="material-symbols-outlined text-lg" aria-hidden="true">close</span>
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
            e.target.setAttribute('aria-checked', String(ativa));
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
                e.target.setAttribute('aria-checked', String(!ativa));
            }
        });
    });

    // Adicionar novo site com validação inline silenciosa
    const formAdd = document.getElementById('form-add-sereia');
    const inputSite = document.getElementById('input-new-sereia');
    const errorMsg = document.getElementById('sereia-error-msg');

    const showError = (msg) => {
        if (!errorMsg || !inputSite) return;
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
        inputSite.setAttribute('aria-invalid', 'true');
        inputSite.classList.add('border-error');
        inputSite.classList.remove('border-outline-variant');
    };

    const clearError = () => {
        if (!errorMsg || !inputSite) return;
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
        inputSite.setAttribute('aria-invalid', 'false');
        inputSite.classList.remove('border-error');
        inputSite.classList.add('border-outline-variant');
    };

    if (inputSite) {
        // Limpa erro silenciosamente na digitação
        inputSite.addEventListener('input', () => {
            if (inputSite.getAttribute('aria-invalid') === 'true') {
                clearError();
            }
        });

        // Validação não-bloqueante no blur
        inputSite.addEventListener('blur', () => {
            const val = inputSite.value.trim();
            if (val) {
                const erro = validateDomain(val);
                if (erro) {
                    showError(erro);
                } else {
                    clearError();
                }
            } else {
                clearError();
            }
        });
    }

    if (formAdd && inputSite) {
        formAdd.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = inputSite.value.trim();
            const erro = validateDomain(val);

            if (erro) {
                showError(erro);
                inputSite.focus();
                return;
            }

            const cleanSite = sanitizeDomain(val);
            try {
                const configAtualizada = await invokeTauri('adicionar_sereia', { site: cleanSite });
                inputSite.value = '';
                clearError();
                if (configAtualizada) {
                    renderConfiguracoes(configAtualizada);
                }
            } catch (err) {
                showError('Não foi possível adicionar o domínio: ' + err);
                inputSite.focus();
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

