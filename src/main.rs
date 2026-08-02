mod hosts_manager;
mod timer;

use timer::SessionType;

fn main() {
    println!("╔══════════════════════════════════════════╗");
    println!("║              NOSTAK v0.1.0               ║");
    println!("║   Sua mente focada, livre de distrações  ║");
    println!("╚══════════════════════════════════════════╝");

    // Configurações do MVP (em segundos para facilitar os testes)
    let tempo_foco_segundos = 20;   // 20 segundos de teste
    let tempo_pausa_segundos = 10;  // 10 segundos de pausa

    let sites_bloqueados = vec!["instagram.com", "twitter.com", "youtube.com", "tiktok.com"];

    // 🛡️ REGISTRO DE SEGURANÇA (Graceful Shutdown)
    // Se o usuário pressionar Ctrl+C, o Nostak restaura o arquivo hosts antes de sair.
    ctrlc::set_handler(move || {
        println!("\n\n⚠️ Sinal de encerramento detectado (Ctrl+C)!");
        println!("[Nostak] Limpando bloqueios e restaurando o sistema...");
        let _ = hosts_manager::unblock_domains();
        println!("[Nostak] Sistema restaurado. Até logo!");
        std::process::exit(0);
    }).expect("Erro ao configurar o manipulador de Ctrl+C");

    // LOOP PRINCIPAL DO POMODORO
    loop {
        // --- 1. INÍCIO DO CICLO DE FOCO ---
        println!("\n[1/2] Iniciando Bloqueio de Distrações...");
        if let Err(e) = hosts_manager::block_domains(&sites_bloqueados) {
            eprintln!("Erro ao bloquear sites: {}. Verifique permissões de superusuário.", e);
            break;
        }

        // Executa o cronômetro de Foco
        timer::run_countdown(SessionType::Focus, tempo_foco_segundos);

        // --- 2. INÍCIO DA PAUSA ---
        println!("\n[2/2] Desbloqueando sites para a Pausa...");
        if let Err(e) = hosts_manager::unblock_domains() {
            eprintln!("Erro ao desbloquear sites: {}", e);
        }

        // Executa o cronômetro de Pausa
        timer::run_countdown(SessionType::ShortBreak, tempo_pausa_segundos);

        // Pergunta ao usuário se deseja iniciar um novo ciclo
        println!("\nDeseja iniciar outro ciclo de Foco? (S/n): ");
        let mut resposta = String::new();
        std::io::stdin().read_line(&mut resposta).unwrap();

        if resposta.trim().to_lowercase() == "n" {
            println!("[Nostak] Encerrando sessão de estudos. Bom trabalho!");
            break;
        }
    }
}