import { invokeTauri } from './ipc.js';

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

export function renderTarefas(tarefas = []) {
    const listContainer = document.getElementById('tasks-list');
    const emptyState = document.getElementById('tasks-empty');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (!tarefas || tarefas.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tarefas.forEach(tarefa => {
        const item = document.createElement('div');
        item.className = 'group flex items-center gap-4 p-4 rounded-sm border border-outline-variant hover:border-outline hover:bg-surface-container transition-colors';

        const textClasses = tarefa.concluida
            ? 'flex-grow font-body-md text-body-md text-on-surface-variant line-through cursor-pointer select-none'
            : 'flex-grow font-body-md text-body-md text-on-surface cursor-pointer select-none';

        const badgeClasses = getCategoryBadgeClasses(tarefa.categoria);

        item.innerHTML = `
            <input
                type="checkbox"
                data-task-id="${tarefa.id}"
                class="task-checkbox w-4 h-4 bg-transparent border-outline text-primary-container focus:ring-0 rounded-sm cursor-pointer shrink-0"
                ${tarefa.concluida ? 'checked' : ''}
            />
            <span data-task-id="${tarefa.id}" class="task-text ${textClasses}">
                ${escapeHtml(tarefa.texto)}
            </span>
            <span class="${badgeClasses} px-2 py-0.5 rounded-sm font-label-sm text-label-sm uppercase shrink-0">
                ${escapeHtml(tarefa.categoria || 'Rotina')}
            </span>
            <button
                type="button"
                data-remove-id="${tarefa.id}"
                class="btn-remove-task text-on-surface-variant/60 hover:text-error hover:bg-error/10 p-1 rounded-sm transition-colors shrink-0"
                title="Remover tarefa"
            >
                <span class="material-symbols-outlined text-base">close</span>
            </button>
        `;

        listContainer.appendChild(item);
    });
}

export function initTasks(initialTarefas = []) {
    renderTarefas(initialTarefas);

    const btnToggleAdd = document.getElementById('btn-toggle-add-task');
    const formAddTask = document.getElementById('form-add-task');
    const btnCancelTask = document.getElementById('btn-cancel-add-task');
    const inputTitle = document.getElementById('input-task-title');
    const selectCategory = document.getElementById('select-task-category');
    const listContainer = document.getElementById('tasks-list');

    if (btnToggleAdd && formAddTask) {
        btnToggleAdd.addEventListener('click', () => {
            const isHidden = formAddTask.classList.contains('hidden');
            if (isHidden) {
                formAddTask.classList.remove('hidden');
                if (inputTitle) inputTitle.focus();
            } else {
                formAddTask.classList.add('hidden');
            }
        });
    }

    if (btnCancelTask && formAddTask) {
        btnCancelTask.addEventListener('click', () => {
            formAddTask.classList.add('hidden');
            if (inputTitle) inputTitle.value = '';
        });
    }

    if (formAddTask && inputTitle) {
        formAddTask.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = inputTitle.value.trim();
            const categoria = selectCategory ? selectCategory.value : 'Rotina';
            if (!texto) return;

            try {
                const configAtualizada = await invokeTauri('adicionar_tarefa', { texto, categoria });
                inputTitle.value = '';
                formAddTask.classList.add('hidden');
                if (configAtualizada && configAtualizada.tarefas) {
                    renderTarefas(configAtualizada.tarefas);
                }
            } catch (err) {
                console.error('[Nostak] Erro ao adicionar tarefa:', err);
                alert('Não foi possível adicionar a tarefa: ' + err);
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
                if (configAtualizada && configAtualizada.tarefas) {
                    renderTarefas(configAtualizada.tarefas);
                }
            } catch (err) {
                console.error('[Nostak] Erro ao alternar tarefa:', err);
                checkbox.checked = !concluida;
            }
        });

        // Clicar no texto da tarefa ou no botão de remover
        listContainer.addEventListener('click', async (e) => {
            const btnRemove = e.target.closest('.btn-remove-task');
            if (btnRemove) {
                const id = parseInt(btnRemove.getAttribute('data-remove-id'), 10);
                try {
                    const configAtualizada = await invokeTauri('remover_tarefa', { id });
                    if (configAtualizada && configAtualizada.tarefas) {
                        renderTarefas(configAtualizada.tarefas);
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

