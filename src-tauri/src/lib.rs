mod config;
mod hosts_manager;
mod state;

use state::AppState;
use tauri::command;

#[command]
fn zarpar_jornada(sites: Vec<String>, state: tauri::State<AppState>) -> Result<String, String> {
    let sites_para_bloquear = if sites.is_empty() {
        let config = state.get_config()?;
        config.get_all_blocked_sites()
    } else {
        sites
    };

    let sites_ref: Vec<&str> = sites_para_bloquear.iter().map(|s| s.as_str()).collect();

    // Executa apenas o bloqueador de hosts
    hosts_manager::block_domains(&sites_ref)
        .map_err(|e| format!("Falha ao erguer as velas: {}", e))?;

    Ok("Velas erguidas! Viagem iniciada com sucesso.".into())
}

#[command]
fn ancorar_porto_seguro() -> Result<String, String> {
    hosts_manager::unblock_domains()
        .map_err(|e| format!("Falha ao baixar âncora: {}", e))?;

    Ok("Navio ancorado em Porto Seguro. Bloqueios removidos.".into())
}

#[command]
fn obter_configuracoes(state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.get_config()
}

#[command]
fn alternar_categoria(categoria: String, ativa: bool, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.alternar_categoria(&categoria, ativa);
    })
}

#[command]
fn adicionar_sereia(site: String, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.adicionar_site_personalizado(site);
    })
}

#[command]
fn remover_sereia(site: String, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.remover_site_personalizado(&site);
    })
}

#[command]
fn atualizar_tempos(tempo_foco_minutos: u64, tempo_pausa_minutos: u64, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.atualizar_tempos(tempo_foco_minutos, tempo_pausa_minutos);
    })
}

#[command]
fn atualizar_preferencias(som_ativo: bool, auto_iniciar_descanso: bool, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.atualizar_preferencias(som_ativo, auto_iniciar_descanso);
    })
}

#[command]
fn resetar_progresso(state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.resetar_progresso();
    })
}

#[command]
fn adicionar_tarefa(
    texto: String,
    categoria: String,
    sessoes_estimadas: Option<u64>,
    state: tauri::State<AppState>,
) -> Result<config::Config, String> {
    let (config, _) = state.mutate_result(|cfg| {
        cfg.adicionar_tarefa(texto, categoria, sessoes_estimadas.unwrap_or(1))
            .ok_or_else(|| "O texto da tarefa não pode estar vazio.".to_string())
    })?;
    Ok(config)
}

#[command]
fn selecionar_tarefa_ativa(id: Option<u64>, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.selecionar_tarefa_ativa(id);
    })
}

#[command]
fn alternar_tarefa(id: u64, concluida: bool, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.alternar_tarefa(id, concluida);
    })
}

#[command]
fn remover_tarefa(id: u64, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.remover_tarefa(id);
    })
}

#[command]
fn aplicar_template(nome_template: String, substituir: bool, state: tauri::State<AppState>) -> Result<config::Config, String> {
    let (config, _) = state.mutate_result(|cfg| {
        if cfg.aplicar_template(&nome_template, substituir) {
            Ok(())
        } else {
            Err(format!("Template '{}' não encontrado.", nome_template))
        }
    })?;
    Ok(config)
}

#[command]
fn salvar_template(nome: String, state: tauri::State<AppState>) -> Result<config::Config, String> {
    let (config, _) = state.mutate_result(|cfg| {
        if cfg.salvar_template_de_tarefas_atuais(nome) {
            Ok(())
        } else {
            Err("Informe um nome válido e tenha ao menos uma tarefa na lista para salvar o template.".to_string())
        }
    })?;
    Ok(config)
}

#[command]
fn remover_template(nome: String, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.remover_template(&nome);
    })
}

#[command]
fn registrar_sessao_concluida(minutos_foco: u64, state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.registrar_sessao_concluida(minutos_foco);
    })
}

#[command]
fn registrar_sessao_interrompida(state: tauri::State<AppState>) -> Result<config::Config, String> {
    state.mutate(|cfg| {
        cfg.registrar_sessao_interrompida();
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_config = config::Config::load_or_create()
        .expect("Falha crítica ao carregar configuração inicial do Nostak");

    tauri::Builder::default()
        .manage(state::AppState::new(initial_config))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed = event {
                if hosts_manager::has_active_blocks() {
                    println!("[Nostak] Janela fechada durante sessão ativa. Removendo bloqueios de segurança...");
                    let _ = hosts_manager::unblock_domains();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            zarpar_jornada,
            ancorar_porto_seguro,
            obter_configuracoes,
            alternar_categoria,
            adicionar_sereia,
            remover_sereia,
            atualizar_tempos,
            atualizar_preferencias,
            resetar_progresso,
            adicionar_tarefa,
            selecionar_tarefa_ativa,
            alternar_tarefa,
            remover_tarefa,
            aplicar_template,
            salvar_template,
            remover_template,
            registrar_sessao_concluida,
            registrar_sessao_interrompida
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar a aplicação Tauri");
}
