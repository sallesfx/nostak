use std::io::{self, Write};
use std::thread;
use std::time::Duration;

pub enum SessionType {
    Focus,
    ShortBreak,
}

fn format_time(seconds: u64) -> String {
    let mins = seconds / 60;
    let secs = seconds % 60;
    format!("{:02}:{:02}", mins, secs)
}

pub fn run_countdown(session_type: SessionType, total_seconds: u64) {
    let title = match session_type {
        SessionType::Focus => "🔥 MODO FOCO ATIVO",
        SessionType::ShortBreak => "☕ DESCANSO CURTO",
    };

    println!("\n==========================================");
    println!("  {}", title);
    println!("==========================================\n");

    for remaining in (1..=total_seconds).rev() {
        print!("\r⏳ Tempo restante: [{}] ", format_time(remaining));
        io::stdout().flush().unwrap();
        thread::sleep(Duration::from_secs(1));
    }

    println!("\n\n✅ Ciclo finalizado!");
}