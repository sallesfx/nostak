/**
 * Módulo central de comunicação IPC com o backend Rust (Tauri v2).
 * Inclui fallback seguro para visualização em navegador comum e utilitário de áudio náutico.
 */

export async function invokeTauri(cmd, args = {}) {
    // 1. Suporte padrão com withGlobalTauri: false (Tauri v2 internals)
    if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
        return await window.__TAURI_INTERNALS__.invoke(cmd, args);
    }
    // 2. Fallback caso withGlobalTauri esteja habilitado
    if (window.__TAURI__) {
        const invokeFn = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
        if (typeof invokeFn === 'function') {
            return await invokeFn(cmd, args);
        }
    }
    console.warn(`[Nostak Simulation] Tauri IPC não detectado. Executando ${cmd}`, args);
    return simulateTauriCommand(cmd, args);
}

/**
 * Toca um sino náutico suave sintetizado via Web Audio API (sem arquivos externos).
 */
export function playNauticalBell(type = 'focus-end') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        let notes;
        let waveType = 'sine';
        let stepDelay = 0.35;
        let decayTime = 1.4;
        let gainPeak = 0.22;

        if (type === 'focus-end') {
            notes = [528, 792]; // Acorde ascendente suave (Dó5 -> Sol5)
        } else if (type === 'voyage-failed') {
            notes = [440, 349, 261]; // Tríade menor descendente (Lá4 -> Fá4 -> Dó4 - aviso náutico)
            waveType = 'triangle';
            stepDelay = 0.22;
            decayTime = 0.9;
            gainPeak = 0.26;
        } else {
            notes = [660, 528]; // Pausa concluída / retorno ao foco (Mi5 -> Dó5)
        }

        notes.forEach((freq, idx) => {
            const startTime = ctx.currentTime + idx * stepDelay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + decayTime + 0.05);
        });
    } catch (e) {
        console.warn('[Nostak] Áudio indisponível:', e);
    }
}

function getDefaultTemplates() {
    return [
        {
            nome: 'Alemão',
            itens: [
                { texto: 'Leitura e vocabulário em alemão', categoria: 'Foco', sessoes_estimadas: 1 },
                { texto: 'Exercícios de gramática e escuta', categoria: 'Rotina', sessoes_estimadas: 2 }
            ]
        },
        {
            nome: 'Matemática',
            itens: [
                { texto: 'Estudo de teoria e conceitos', categoria: 'Foco', sessoes_estimadas: 2 },
                { texto: 'Prática e resolução de exercícios', categoria: 'Urgente', sessoes_estimadas: 3 }
            ]
        }
    ];
}

function garantirTarefaAtivaMock(cfg) {
    const valida = cfg.tarefas.some(t => t.id === cfg.tarefa_ativa_id && !t.concluida);
    if (!valida) {
        const prox = cfg.tarefas.find(t => !t.concluida);
        cfg.tarefa_ativa_id = prox ? prox.id : null;
    }
}

// Fallback em memória/localStorage apenas quando aberto fora do Tauri
function getMockConfig() {
    const raw = localStorage.getItem('nostak_mock_config');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.som_ativo !== 'boolean') parsed.som_ativo = true;
            if (typeof parsed.auto_iniciar_descanso !== 'boolean') parsed.auto_iniciar_descanso = true;
            if (!Array.isArray(parsed.templates_tarefas) || parsed.templates_tarefas.length === 0) {
                parsed.templates_tarefas = getDefaultTemplates();
            }
            if (Array.isArray(parsed.tarefas)) {
                parsed.tarefas.forEach(t => {
                    if (!t.sessoes_estimadas) t.sessoes_estimadas = 1;
                    if (typeof t.sessoes_concluidas !== 'number') t.sessoes_concluidas = 0;
                });
            } else {
                parsed.tarefas = [];
            }
            garantirTarefaAtivaMock(parsed);
            if (!parsed.progresso) {
                parsed.progresso = {
                    total_minutos_foco: 0,
                    sessoes_concluidas: 0,
                    sessoes_interrompidas: 0,
                    maior_sessao_minutos: 0,
                    sereias_silenciadas: 0
                };
            }
            return parsed;
        } catch (_) {}
    }
    return {
        tempo_foco_minutos: 25,
        tempo_pausa_minutos: 5,
        som_ativo: true,
        auto_iniciar_descanso: true,
        categorias_ativas: ['redes_sociais', 'streaming_e_videos'],
        sites_personalizados: [],
        tarefa_ativa_id: 2,
        tarefas: [
            { id: 1, texto: 'Mapear rota de águas profundas', categoria: 'Rotina', concluida: true, sessoes_estimadas: 1, sessoes_concluidas: 1 },
            { id: 2, texto: 'Limpar convés de distrações digitais', categoria: 'Urgente', concluida: false, sessoes_estimadas: 1, sessoes_concluidas: 0 },
            { id: 3, texto: 'Calibrar sextante de produtividade', categoria: 'Rotina', concluida: false, sessoes_estimadas: 2, sessoes_concluidas: 0 },
            { id: 4, texto: 'Navegar por 45 min sem interrupção', categoria: 'Foco', concluida: false, sessoes_estimadas: 2, sessoes_concluidas: 0 }
        ],
        templates_tarefas: getDefaultTemplates(),
        progresso: {
            total_minutos_foco: 0,
            sessoes_concluidas: 0,
            sessoes_interrompidas: 0,
            maior_sessao_minutos: 0,
            sereias_silenciadas: 0
        }
    };
}

function saveMockConfig(cfg) {
    localStorage.setItem('nostak_mock_config', JSON.stringify(cfg));
    return cfg;
}

function simulateTauriCommand(cmd, args) {
    const cfg = getMockConfig();
    switch (cmd) {
        case 'obter_configuracoes':
            return cfg;
        case 'atualizar_tempos':
            cfg.tempo_foco_minutos = args.tempoFocoMinutos ?? cfg.tempo_foco_minutos;
            cfg.tempo_pausa_minutos = args.tempoPausaMinutos ?? cfg.tempo_pausa_minutos;
            return saveMockConfig(cfg);
        case 'atualizar_preferencias':
            if (typeof args.somAtivo === 'boolean') cfg.som_ativo = args.somAtivo;
            if (typeof args.autoIniciarDescanso === 'boolean') cfg.auto_iniciar_descanso = args.autoIniciarDescanso;
            return saveMockConfig(cfg);
        case 'resetar_progresso':
            cfg.progresso = {
                total_minutos_foco: 0,
                sessoes_concluidas: 0,
                sessoes_interrompidas: 0,
                maior_sessao_minutos: 0,
                sereias_silenciadas: 0
            };
            return saveMockConfig(cfg);
        case 'alternar_categoria':
            if (args.ativa && !cfg.categorias_ativas.includes(args.categoria)) {
                cfg.categorias_ativas.push(args.categoria);
            } else if (!args.ativa) {
                cfg.categorias_ativas = cfg.categorias_ativas.filter(c => c !== args.categoria);
            }
            return saveMockConfig(cfg);
        case 'adicionar_sereia':
            if (args.site && !cfg.sites_personalizados.includes(args.site)) {
                cfg.sites_personalizados.push(args.site);
            }
            return saveMockConfig(cfg);
        case 'remover_sereia':
            cfg.sites_personalizados = cfg.sites_personalizados.filter(s => s !== args.site);
            return saveMockConfig(cfg);
        case 'adicionar_tarefa': {
            const nextId = cfg.tarefas.reduce((max, t) => Math.max(max, t.id), 0) + 1;
            const sessoesEstimadas = Math.max(1, args.sessoesEstimadas || 1);
            cfg.tarefas.push({
                id: nextId,
                texto: args.texto,
                categoria: args.categoria || 'Rotina',
                concluida: false,
                sessoes_estimadas: sessoesEstimadas,
                sessoes_concluidas: 0
            });
            garantirTarefaAtivaMock(cfg);
            return saveMockConfig(cfg);
        }
        case 'alternar_tarefa': {
            const t = cfg.tarefas.find(item => item.id === args.id);
            if (t) {
                t.concluida = args.concluida;
                if (args.concluida && t.sessoes_concluidas < t.sessoes_estimadas) {
                    t.sessoes_concluidas = t.sessoes_estimadas;
                }
            }
            garantirTarefaAtivaMock(cfg);
            return saveMockConfig(cfg);
        }
        case 'remover_tarefa':
            cfg.tarefas = cfg.tarefas.filter(item => item.id !== args.id);
            garantirTarefaAtivaMock(cfg);
            return saveMockConfig(cfg);
        case 'selecionar_tarefa_ativa':
            cfg.tarefa_ativa_id = args.id ?? null;
            garantirTarefaAtivaMock(cfg);
            return saveMockConfig(cfg);
        case 'aplicar_template': {
            const target = (args.nome || args.nomeTemplate || '').toLowerCase();
            const tpl = cfg.templates_tarefas.find(t => t.nome.toLowerCase() === target);
            if (tpl) {
                let nextId = cfg.tarefas.reduce((max, t) => Math.max(max, t.id), 0) + 1;
                let firstNewId = null;
                tpl.itens.forEach(item => {
                    if (firstNewId === null) firstNewId = nextId;
                    cfg.tarefas.push({
                        id: nextId++,
                        texto: item.texto,
                        categoria: item.categoria || 'Rotina',
                        concluida: false,
                        sessoes_estimadas: Math.max(1, item.sessoes_estimadas || 1),
                        sessoes_concluidas: 0
                    });
                });
                if (cfg.tarefa_ativa_id === null && firstNewId !== null) {
                    cfg.tarefa_ativa_id = firstNewId;
                }
                garantirTarefaAtivaMock(cfg);
            }
            return saveMockConfig(cfg);
        }
        case 'salvar_template': {
            const nome = (args.nome || '').trim();
            if (!nome) throw new Error('Informe um nome para o template.');
            const pendentes = cfg.tarefas.filter(t => !t.concluida);
            const fonte = pendentes.length > 0 ? pendentes : cfg.tarefas;
            if (fonte.length === 0) throw new Error('Adicione ao menos uma tarefa antes de salvar um template.');
            const itens = fonte.map(t => ({
                texto: t.texto,
                categoria: t.categoria,
                sessoes_estimadas: Math.max(1, t.sessoes_estimadas || 1)
            }));
            cfg.templates_tarefas = cfg.templates_tarefas.filter(t => t.nome.toLowerCase() !== nome.toLowerCase());
            cfg.templates_tarefas.push({ nome, itens });
            return saveMockConfig(cfg);
        }
        case 'remover_template':
            cfg.templates_tarefas = cfg.templates_tarefas.filter(t => t.nome.toLowerCase() !== (args.nome || '').toLowerCase());
            return saveMockConfig(cfg);
        case 'registrar_sessao_concluida': {
            const mins = args.minutosFoco || cfg.tempo_foco_minutos || 25;
            cfg.progresso.total_minutos_foco += mins;
            cfg.progresso.sessoes_concluidas += 1;
            if (mins > cfg.progresso.maior_sessao_minutos) {
                cfg.progresso.maior_sessao_minutos = mins;
            }
            cfg.progresso.sereias_silenciadas += (cfg.categorias_ativas.length * 4) + cfg.sites_personalizados.length;

            garantirTarefaAtivaMock(cfg);
            if (cfg.tarefa_ativa_id !== null) {
                const t = cfg.tarefas.find(item => item.id === cfg.tarefa_ativa_id && !item.concluida);
                if (t) {
                    t.sessoes_concluidas = (t.sessoes_concluidas || 0) + 1;
                    if (t.sessoes_concluidas >= (t.sessoes_estimadas || 1)) {
                        t.concluida = true;
                    }
                }
            }
            garantirTarefaAtivaMock(cfg);
            return saveMockConfig(cfg);
        }
        case 'registrar_sessao_interrompida':
            cfg.progresso.sessoes_interrompidas += 1;
            return saveMockConfig(cfg);
        default:
            return `[Simulado] Comando ${cmd} executado.`;
    }
}

window.invokeTauri = invokeTauri;
window.playNauticalBell = playNauticalBell;
