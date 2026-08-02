mod config;
mod hosts_manager;
mod timer;

use config::Config;
use timer::SessionType;

fn main() {
    println!("╔══════════════════════════════════════════╗");
    println!("║              NOSTAK v0.1.0               ║");
    println!("║   Sua mente focada, livre de distrações  ║");
    println!("╚══════════════════════════════════════════╝");

    // 1. Carrega ou cria o arquivo de configuração
    let config = match Config::load_or_create() {
        Ok(cfg) => cfg,
        Err(e) => {
            eprintln!("[Nostak] Erro ao carregar 'config.toml': {}", e);
            return;
        }
    };

    let tempo_foco_segundos = config.tempo_foco_minutos * 60;
    let tempo_pausa_segundos = config.tempo_pausa_minutos * 60;

    let lista_sites_string = config.get_all_blocked_sites();
    let sites_bloqueados: Vec<&str> = lista_sites_string
        .iter()
        .map(|s| s.as_str())
        .collect();

    println!("\n⚙️ Configuração carregada:");
    println!("   - Tempo de Foco: {} min", config.tempo_foco_minutos);
    println!("   - Tempo de Pausa: {} min", config.tempo_pausa_minutos);
    println!("   - Categorias ativas: {:?}", config.categorias_ativas);
    println!("   - Total de sites bloqueados: {}", sites_bloqueados.len());

    // 🛡️ REGISTRO DE SEGURANÇA (Graceful Shutdown)
    ctrlc::set_handler(move || {
        println!("\n\n⚠️ Sinal de encerramento detectado (Ctrl+C)!");
        println!("[Nostak] Limpando bloqueios e restaurando o sistema...");
        let _ = hosts_manager::unblock_domains();
        println!("[Nostak] Sistema restaurado. Até logo!");
        std::process::exit(0);
    }).expect("Erro ao configurar o manipulador de Ctrl+C");

    // LOOP PRINCIPAL DO POMODORO
    loop {
        println!("\n[1/2] Iniciando Bloqueio de Distrações...");
        if let Err(e) = hosts_manager::block_domains(&sites_bloqueados) {
            eprintln!("Erro ao bloquear sites: {}. Verifique permissões de superusuário.", e);
            break;
        }

        timer::run_countdown(SessionType::Focus, tempo_foco_segundos);

        println!("\n[2/2] Desbloqueando sites para a Pausa...");
        if let Err(e) = hosts_manager::unblock_domains() {
            eprintln!("Erro ao desbloquear sites: {}", e);
        }

        timer::run_countdown(SessionType::ShortBreak, tempo_pausa_segundos);

        println!("\nDeseja iniciar outro ciclo de Foco? (S/n): ");
        let mut resposta = String::new();
        std::io::stdin().read_line(&mut resposta).unwrap();

        if resposta.trim().to_lowercase() == "n" {
            println!("[Nostak] Encerrando sessão de estudos. Bom trabalho!");
            break;
        }
    }
}