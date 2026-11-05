/**
 * Módulo central de comunicação IPC com o backend Rust (Tauri v2).
 * Inclui fallback seguro para visualização em navegador comum.
 */

export async function invokeTauri(cmd, args = {}) {
    if (window.__TAURI__) {
        const invokeFn = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
        if (typeof invokeFn === 'function') {
            return await invokeFn(cmd, args);
        }
    }
    console.warn(`[Nostak Simulation] Tauri IPC não detectado. Executando ${cmd}`, args);
    return simulateTauriCommand(cmd, args);
}

// Fallback em memória/localStorage apenas quando aberto fora do Tauri
function getMockConfig() {
    const raw = localStorage.getItem('nostak_mock_config');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
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
        categorias_ativas: ['redes_sociais', 'streaming_e_videos'],
        sites_personalizados: [],
        tarefas: [
            { id: 1, texto: 'Mapear rota de águas profundas', categoria: 'Rotina', concluida: true },
            { id: 2, texto: 'Limpar convés de distrações digitais', categoria: 'Urgente', concluida: false },
            { id: 3, texto: 'Calibrar sextante de produtividade', categoria: 'Rotina', concluida: false },
            { id: 4, texto: 'Navegar por 45 min sem interrupção', categoria: 'Foco', concluida: false }
        ],
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
            cfg.tarefas.push({
                id: nextId,
                texto: args.texto,
                categoria: args.categoria || 'Rotina',
                concluida: false
            });
            return saveMockConfig(cfg);
        }
        case 'alternar_tarefa': {
            const t = cfg.tarefas.find(item => item.id === args.id);
            if (t) t.concluida = args.concluida;
            return saveMockConfig(cfg);
        }
        case 'remover_tarefa':
            cfg.tarefas = cfg.tarefas.filter(item => item.id !== args.id);
            return saveMockConfig(cfg);
        case 'registrar_sessao_concluida': {
            const mins = args.minutosFoco || cfg.tempo_foco_minutos || 25;
            cfg.progresso.total_minutos_foco += mins;
            cfg.progresso.sessoes_concluidas += 1;
            if (mins > cfg.progresso.maior_sessao_minutos) {
                cfg.progresso.maior_sessao_minutos = mins;
            }
            cfg.progresso.sereias_silenciadas += (cfg.categorias_ativas.length * 4) + cfg.sites_personalizados.length;
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
