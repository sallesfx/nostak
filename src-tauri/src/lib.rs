mod config;
mod hosts_manager;

use tauri::command;

#[command]
fn zarpar_jornada(sites: Vec<String>) -> Result<String, String> {
    let sites_para_bloquear = if sites.is_empty() {
        let config = config::Config::load_or_create()
            .map_err(|e| format!("Falha ao carregar configurações: {}", e))?;
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
fn obter_configuracoes() -> Result<config::Config, String> {
    config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))
}

#[command]
fn alternar_categoria(categoria: String, ativa: bool) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.alternar_categoria(&categoria, ativa);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn adicionar_sereia(site: String) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.adicionar_site_personalizado(site);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn remover_sereia(site: String) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.remover_site_personalizado(&site);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn atualizar_tempos(tempo_foco_minutos: u64, tempo_pausa_minutos: u64) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.atualizar_tempos(tempo_foco_minutos, tempo_pausa_minutos);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn atualizar_preferencias(som_ativo: bool, auto_iniciar_descanso: bool) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.atualizar_preferencias(som_ativo, auto_iniciar_descanso);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn resetar_progresso() -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.resetar_progresso();
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn adicionar_tarefa(texto: String, categoria: String) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.adicionar_tarefa(texto, categoria)
        .ok_or_else(|| "O texto da tarefa não pode estar vazio.".to_string())?;
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn alternar_tarefa(id: u64, concluida: bool) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.alternar_tarefa(id, concluida);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn remover_tarefa(id: u64) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.remover_tarefa(id);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn registrar_sessao_concluida(minutos_foco: u64) -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.registrar_sessao_concluida(minutos_foco);
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[command]
fn registrar_sessao_interrompida() -> Result<config::Config, String> {
    let mut config = config::Config::load_or_create()
        .map_err(|e| format!("Falha ao ler configuração: {}", e))?;
    config.registrar_sessao_interrompida();
    config.save()
        .map_err(|e| format!("Falha ao salvar configuração: {}", e))?;
    Ok(config)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            alternar_tarefa,
            remover_tarefa,
            registrar_sessao_concluida,
            registrar_sessao_interrompida
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar a aplicação Tauri");
}
