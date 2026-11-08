import { invokeTauri } from './ipc.js';
import { nostakAlert } from './components.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getCategoryBadgeClasses(categoria) {
    const cat = (categoria || 'Rotina').toLowerCase();
    if (cat === 'urgente') {
        return 'text-primary bg-primary/10 border border-primary/30';
    }
    if (cat === 'foco') {
        return 'text-tertiary bg-tertiary/10 border border-tertiary/30';
    }
    return 'text-secondary bg-secondary-container/30 border border-secondary/30';
}

function updateActiveTaskBanner(tarefas = [], tarefaAtivaId = null) {
    const activeTask = tarefas.find(t => t.id === tarefaAtivaId && !t.concluida)
        || tarefas.find(t => !t.concluida)
        || null;

    const textIdle = document.getElementById('active-task-text-idle');
    const sessionsIdle = document.getElementById('active-task-sessions-idle');
    const bannerIdle = document.getElementById('active-task-banner-idle');

    const textActive = document.getElementById('active-task-text-active');
    const sessionsActive = document.getElementById('active-task-sessions-active');

    if (activeTask) {
        const concluidas = activeTask.sessoes_concluidas || 0;
        const estimadas = activeTask.sessoes_estimadas || 1;
        const sessionLabel = `${concluidas}/${estimadas} sessões`;

        if (textIdle) textIdle.textContent = `Manobra: ${activeTask.texto}`;
        if (sessionsIdle) {
            sessionsIdle.textContent = sessionLabel;
            sessionsIdle.classList.remove('hidden');
        }
        if (bannerIdle) {
            bannerIdle.classList.add('border-primary/40', 'text-on-surface');
            bannerIdle.classList.remove('border-outline-variant', 'text-on-surface-variant');
        }

        if (textActive) textActive.textContent = activeTask.texto;
        if (sessionsActive) {
            sessionsActive.textContent = sessionLabel;
            sessionsActive.classList.remove('hidden');
        }
    } else {
        if (textIdle) textIdle.textContent = 'Nenhuma tarefa atrelada • Adicione no Diário abaixo';
        if (sessionsIdle) sessionsIdle.classList.add('hidden');
        if (bannerIdle) {
            bannerIdle.classList.remove('border-primary/40', 'text-on-surface');
            bannerIdle.classList.add('border-outline-variant', 'text-on-surface-variant');
        }

        if (textActive) textActive.textContent = 'Navegando em Foco Livre';
        if (sessionsActive) sessionsActive.classList.add('hidden');
    }
}

export function renderTarefas(tarefas = [], tarefaAtivaId = null) {
    updateActiveTaskBanner(tarefas, tarefaAtivaId);

    const listContainer = document.getElementById('tasks-list');
    const emptyState = document.getElementById('tasks-empty');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (!tarefas || tarefas.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const effectiveActiveId = (tarefas.some(t => t.id === tarefaAtivaId && !t.concluida))
        ? tarefaAtivaId
        : (tarefas.find(t => !t.concluida)?.id ?? null);

    tarefas.forEach(tarefa => {
        const isActive = !tarefa.concluida && tarefa.id === effectiveActiveId;
        const concluidas = tarefa.sessoes_concluidas || 0;
        const estimadas = tarefa.sessoes_estimadas || 1;

        const item = document.createElement('div');
        item.className = isActive
            ? 'group flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 rounded-sm border border-primary/60 bg-primary/5 transition-colors'
            : 'group flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 rounded-sm border border-outline-variant hover:border-outline hover:bg-surface-container transition-colors';

        const textClasses = tarefa.concluida
            ? 'flex-grow font-body-md text-body-md text-on-surface-variant line-through cursor-pointer select-none'
            : 'flex-grow font-body-md text-body-md text-on-surface cursor-pointer select-none';

        const badgeClasses = getCategoryBadgeClasses(tarefa.categoria);

        const focusBtnHtml = !tarefa.concluida
            ? `<button
                type="button"
                data-focus-id="${tarefa.id}"
                aria-pressed="${isActive ? 'true' : 'false'}"
                title="${isActive ? 'Tarefa ativa no Temporizador' : 'Focar nesta tarefa no Temporizador'}"
                aria-label="${isActive ? 'Tarefa em foco: ' + escapeHtml(tarefa.texto) : 'Focar tarefa no Temporizador: ' + escapeHtml(tarefa.texto)}"
                class="btn-focus-task px-2.5 py-1 rounded-sm font-label-sm text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors shrink-0 ${
                    isActive
                        ? 'bg-primary text-on-primary font-bold cursor-default'
                        : 'border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }"
               >
                 <span class="material-symbols-outlined text-xs" aria-hidden="true">${isActive ? 'anchor' : 'play_arrow'}</span>
                 <span>${isActive ? 'Em Foco' : 'Focar'}</span>
               </button>`
            : '';

        item.innerHTML = `
            <input
                type="checkbox"
                data-task-id="${tarefa.id}"
                aria-label="Marcar tarefa ${escapeHtml(tarefa.texto)} como concluída"
                class="task-checkbox w-4 h-4 bg-transparent border-outline text-primary-container rounded-sm cursor-pointer shrink-0"
                ${tarefa.concluida ? 'checked' : ''}
            />
            <span data-task-id="${tarefa.id}" class="task-text ${textClasses}">
                ${escapeHtml(tarefa.texto)}
            </span>
            <div class="flex items-center gap-2 ml-auto shrink-0">
                <span
                    title="Sessões Pomodoro concluídas / estimadas"
                    class="px-2 py-0.5 rounded-sm font-label-sm text-xs tabular-nums border ${
                        tarefa.concluida
                            ? 'border-outline-variant text-on-surface-variant/60'
                            : 'border-secondary/40 bg-secondary-container/20 text-secondary'
                    }"
                >
                    ⏱ ${concluidas}/${estimadas}
                </span>
                <span class="${badgeClasses} px-2 py-0.5 rounded-sm font-label-sm text-label-sm uppercase shrink-0">
                    ${escapeHtml(tarefa.categoria || 'Rotina')}
                </span>
                ${focusBtnHtml}
                <button
                    type="button"
                    data-remove-id="${tarefa.id}"
                    class="btn-remove-task text-on-surface-variant/60 hover:text-error hover:bg-error/10 w-7 h-7 flex items-center justify-center rounded-sm transition-colors shrink-0"
                    title="Remover tarefa"
                    aria-label="Remover tarefa: ${escapeHtml(tarefa.texto)}"
                >
                    <span class="material-symbols-outlined text-base" aria-hidden="true">close</span>
                </button>
            </div>
        `;

        listContainer.appendChild(item);
    });
}

export function renderTemplates(templates = []) {
    const container = document.getElementById('templates-list');
    if (!container) return;

    container.innerHTML = '';

    if (!templates || templates.length === 0) {
        container.innerHTML = `<span class="text-xs text-on-surface-variant/60 italic">Nenhum template salvo.</span>`;
        return;
    }

    templates.forEach(tpl => {
        const totalTasks = Array.isArray(tpl.itens) ? tpl.itens.length : 0;
        const totalSessions = Array.isArray(tpl.itens)
            ? tpl.itens.reduce((acc, i) => acc + (i.sessoes_estimadas || 1), 0)
            : 0;

        const chip = document.createElement('div');
        chip.className = 'inline-flex items-center rounded-sm border border-outline-variant bg-surface-container-low hover:border-secondary transition-colors overflow-hidden';

        chip.innerHTML = `
            <button
                type="button"
                data-apply-template="${escapeHtml(tpl.nome)}"
                title="Carregar ${totalTasks} tarefa(s) (${totalSessions} sessões Pomodoro)"
                class="btn-apply-template px-3 h-7 text-xs font-label-md text-on-surface hover:text-secondary flex items-center gap-1.5 transition-colors"
            >
                <span class="material-symbols-outlined text-xs text-primary">auto_awesome</span>
                <span class="font-bold">${escapeHtml(tpl.nome)}</span>
                <span class="text-[10px] text-on-surface-variant">(${totalSessions} sessões)</span>
            </button>
            <button
                type="button"
                data-remove-template="${escapeHtml(tpl.nome)}"
                title="Excluir template ${escapeHtml(tpl.nome)}"
                aria-label="Excluir template ${escapeHtml(tpl.nome)}"
                class="btn-remove-template w-7 h-7 flex items-center justify-center text-on-surface-variant/50 hover:text-error hover:bg-error/10 border-l border-outline-variant transition-colors shrink-0"
            >
                <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
            </button>
        `;

        container.appendChild(chip);
    });
}

export function renderTasksState(config = {}) {
    if (!config) return;
    renderTarefas(config.tarefas || [], config.tarefa_ativa_id ?? null);
    renderTemplates(config.templates_tarefas || []);
}

export function initTasks(initialConfig = {}) {
    const configObj = Array.isArray(initialConfig)
        ? { tarefas: initialConfig, tarefa_ativa_id: null, templates_tarefas: [] }
        : initialConfig;

    renderTasksState(configObj);

    const btnToggleAdd = document.getElementById('btn-toggle-add-task');
    const formAddTask = document.getElementById('form-add-task');
    const btnCancelTask = document.getElementById('btn-cancel-add-task');
    const inputTitle = document.getElementById('input-task-title');
    const selectSessions = document.getElementById('select-task-sessions');
    const selectCategory = document.getElementById('select-task-category');
    const listContainer = document.getElementById('tasks-list');

    // Elementos de Templates
    const btnToggleSaveTemplate = document.getElementById('btn-toggle-save-template');
    const formSaveTemplate = document.getElementById('form-save-template');
    const btnCancelSaveTemplate = document.getElementById('btn-cancel-save-template');
    const inputTemplateName = document.getElementById('input-template-name');
    const templatesList = document.getElementById('templates-list');

    if (btnToggleAdd && formAddTask) {
        btnToggleAdd.addEventListener('click', () => {
            const isHidden = formAddTask.classList.contains('hidden');
            if (isHidden) {
                formAddTask.classList.remove('hidden');
                btnToggleAdd.setAttribute('aria-expanded', 'true');
                if (inputTitle) inputTitle.focus();
            } else {
                formAddTask.classList.add('hidden');
                btnToggleAdd.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (btnCancelTask && formAddTask) {
        btnCancelTask.addEventListener('click', () => {
            formAddTask.classList.add('hidden');
            btnToggleAdd?.setAttribute('aria-expanded', 'false');
            if (inputTitle) inputTitle.value = '';
            btnToggleAdd?.focus();
        });
    }

    if (formAddTask && inputTitle) {
        formAddTask.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = inputTitle.value.trim();
            const categoria = selectCategory ? selectCategory.value : 'Rotina';
            const sessoesEstimadas = selectSessions ? parseInt(selectSessions.value, 10) || 1 : 1;
            if (!texto) return;

            try {
                const configAtualizada = await invokeTauri('adicionar_tarefa', {
                    texto,
                    categoria,
                    sessoesEstimadas
                });
                inputTitle.value = '';
                if (selectSessions) selectSessions.value = '1';
                formAddTask.classList.add('hidden');
                btnToggleAdd?.setAttribute('aria-expanded', 'false');
                btnToggleAdd?.focus();
                if (configAtualizada) {
                    renderTasksState(configAtualizada);
                }
            } catch (err) {
                console.error('[Nostak] Erro ao adicionar tarefa:', err);
                await nostakAlert({
                    title: 'Diário do Navegador',
                    message: 'Não foi possível adicionar a tarefa: ' + err,
                    type: 'error'
                });
            }
        });
    }

    // Salvar lista atual como Template
    if (btnToggleSaveTemplate && formSaveTemplate) {
        btnToggleSaveTemplate.addEventListener('click', () => {
            const isHidden = formSaveTemplate.classList.contains('hidden');
            if (isHidden) {
                formSaveTemplate.classList.remove('hidden');
                btnToggleSaveTemplate.setAttribute('aria-expanded', 'true');
                if (inputTemplateName) inputTemplateName.focus();
            } else {
                formSaveTemplate.classList.add('hidden');
                btnToggleSaveTemplate.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (btnCancelSaveTemplate && formSaveTemplate) {
        btnCancelSaveTemplate.addEventListener('click', () => {
            formSaveTemplate.classList.add('hidden');
            btnToggleSaveTemplate?.setAttribute('aria-expanded', 'false');
            if (inputTemplateName) inputTemplateName.value = '';
            btnToggleSaveTemplate?.focus();
        });
    }

    if (formSaveTemplate && inputTemplateName) {
        formSaveTemplate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = inputTemplateName.value.trim();
            if (!nome) return;

            try {
                const configAtualizada = await invokeTauri('salvar_template', { nome });
                inputTemplateName.value = '';
                formSaveTemplate.classList.add('hidden');
                btnToggleSaveTemplate?.setAttribute('aria-expanded', 'false');
                btnToggleSaveTemplate?.focus();
                if (configAtualizada) {
                    renderTasksState(configAtualizada);
                }
            } catch (err) {
                console.error('[Nostak] Erro ao salvar template:', err);
                await nostakAlert({
                    title: 'Templates de Rota',
                    message: String(err).replace(/^Error:\s*/, ''),
                    type: 'error'
                });
            }
        });
    }

    // Eventos na barra de Templates (Aplicar ou Remover Template)
    if (templatesList) {
        templatesList.addEventListener('click', async (e) => {
            const btnApply = e.target.closest('.btn-apply-template');
            if (btnApply) {
                const nome = btnApply.getAttribute('data-apply-template');
                if (!nome) return;
                try {
                    const configAtualizada = await invokeTauri('aplicar_template', { nome });
                    if (configAtualizada) {
                        renderTasksState(configAtualizada);
                    }
                } catch (err) {
                    console.error('[Nostak] Erro ao aplicar template:', err);
                }
                return;
            }

            const btnRemoveTpl = e.target.closest('.btn-remove-template');
            if (btnRemoveTpl) {
                const nome = btnRemoveTpl.getAttribute('data-remove-template');
                if (!nome) return;
                try {
                    const configAtualizada = await invokeTauri('remover_template', { nome });
                    if (configAtualizada) {
                        renderTasksState(configAtualizada);
                    }
                } catch (err) {
                    console.error('[Nostak] Erro ao remover template:', err);
                }
            }
        });
    }

    if (listContainer) {
        // Alternar conclusão via checkbox
        listContainer.addEventListener('change', async (e) => {
            const checkbox = e.target.closest('.task-checkbox');
            if (!checkbox) return;

            const id = parseInt(checkbox.getAttribute('data-task-id'), 10);
            const concluida = checkbox.checked;

            try {
                const configAtualizada = await invokeTauri('alternar_tarefa', { id, concluida });
                if (configAtualizada) {
                    renderTasksState(configAtualizada);
                }
            } catch (err) {
                console.error('[Nostak] Erro ao alternar tarefa:', err);
                checkbox.checked = !concluida;
            }
        });

        // Clicar em Focar, Remover ou no texto da tarefa
        listContainer.addEventListener('click', async (e) => {
            const btnFocus = e.target.closest('.btn-focus-task');
            if (btnFocus) {
                if (btnFocus.getAttribute('aria-pressed') === 'true') {
                    return; // Já está em foco, evita chamada IPC redundante
                }
                const id = parseInt(btnFocus.getAttribute('data-focus-id'), 10);
                try {
                    const configAtualizada = await invokeTauri('selecionar_tarefa_ativa', { id });
                    if (configAtualizada) {
                        renderTasksState(configAtualizada);
                    }
                } catch (err) {
                    console.error('[Nostak] Erro ao selecionar tarefa ativa:', err);
                }
                return;
            }

            const btnRemove = e.target.closest('.btn-remove-task');
            if (btnRemove) {
                const id = parseInt(btnRemove.getAttribute('data-remove-id'), 10);
                try {
                    const configAtualizada = await invokeTauri('remover_tarefa', { id });
                    if (configAtualizada) {
                        renderTasksState(configAtualizada);
                    }
                } catch (err) {
                    console.error('[Nostak] Erro ao remover tarefa:', err);
                }
                return;
            }

            const textSpan = e.target.closest('.task-text');
            if (textSpan) {
                const id = parseInt(textSpan.getAttribute('data-task-id'), 10);
                const checkbox = listContainer.querySelector(`.task-checkbox[data-task-id="${id}"]`);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    }
}


