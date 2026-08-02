mod hosts_manager;

fn main() {
    println!("=== Testando o Módulo de Bloqueio do Nostak ===");

    // Lista de sites para teste
    let sites_para_bloquear = vec!["instagram.com", "twitter.com", "youtube.com"];

    println!("Tentando aplicar o bloqueio...");
    match hosts_manager::block_domains(&sites_para_bloquear) {
        Ok(_) => println!("Sites bloqueados! Tente acessar instagram.com no navegador."),
        Err(e) => eprintln!("Erro ao bloquear sites: {}. Lembre-se de rodar com privilégios de administrador (sudo)!", e),
    }

    println!("\nPressione Enter para DESBLOQUEAR e encerrar o teste...");
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();

    println!("Tentando desbloquear...");
    match hosts_manager::unblock_domains() {
        Ok(_) => println!("Sites desbloqueados com sucesso!"),
        Err(e) => eprintln!("Erro ao desbloquear: {}", e),
    }
}