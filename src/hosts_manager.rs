use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::Path;
use std::process::Command; // 🛠️ Módulo nativo para executar comandos no SO

const START_MARKER: &str = "# --- NOSTAK BLOCK START ---";
const END_MARKER: &str = "# --- NOSTAK BLOCK END ---";

/// Retorna o caminho do arquivo 'hosts' de acordo com o Sistema Operacional
pub fn get_hosts_path() -> &'static str {
    if cfg!(target_os = "windows") {
        r"C:\Windows\System32\drivers\etc\hosts"
    } else {
        "/etc/hosts"
    }
}

/// Limpa o cache de DNS do sistema operacional para garantir que os bloqueios
/// entrem em vigor instantaneamente em qualquer navegador ou aplicação.
pub fn flush_dns_cache() {
    if cfg!(target_os = "windows") {
        // No Windows: ipconfig /flushdns
        let _ = Command::new("ipconfig").arg("/flushdns").output();
    } else if cfg!(target_os = "macos") {
        // No macOS: limpa a dscacheutil e reinicia o serviço mDNSResponder
        let _ = Command::new("dscacheutil").arg("-flushcache").output();
        let _ = Command::new("killall")
            .args(["-HUP", "mDNSResponder"])
            .output();
    } else if cfg!(target_os = "linux") {
        // No Linux (distros modernas com systemd-resolved, como Linux Mint e Ubuntu)
        let _ = Command::new("resolvectl").arg("flush-caches").output();
    }
}

/// Cria um backup do arquivo hosts original antes de qualquer alteração
pub fn create_backup() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let backup_path = format!("{}.nostak.bak", hosts_path);

    if !Path::new(&backup_path).exists() {
        fs::copy(hosts_path, &backup_path)?;
        println!("[Nostak] Backup do arquivo hosts criado em: {}", backup_path);
    }
    Ok(())
}

/// Adiciona uma lista de sites ao arquivo hosts apontando para 127.0.0.1
pub fn block_domains(domains: &[&str]) -> io::Result<()> {
    create_backup()?;

    let hosts_path = get_hosts_path();

    // Limpa bloqueios anteriores do Nostak se existirem
    unblock_domains()?;

    let mut content = String::new();
    File::open(hosts_path)?.read_to_string(&mut content)?;

    let mut new_block = String::new();
    new_block.push_str(&format!("\n{}\n", START_MARKER));

    for domain in domains {
        new_block.push_str(&format!("127.0.0.1 {}\n", domain));
        if !domain.starts_with("www.") {
            new_block.push_str(&format!("127.0.0.1 www.{}\n", domain));
        }
    }

    new_block.push_str(&format!("{}\n", END_MARKER));

    let mut file = OpenOptions::new().append(true).open(hosts_path)?;
    file.write_all(new_block.as_bytes())?;

    // 🚀 Limpa o cache de DNS para que o bloqueio seja instantâneo
    flush_dns_cache();

    println!("[Nostak] Domínios bloqueados e cache de DNS limpo!");
    Ok(())
}

/// Remove o bloco de domínios bloqueados pelo Nostak do arquivo hosts
pub fn unblock_domains() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let mut content = String::new();

    File::open(hosts_path)?.read_to_string(&mut content)?;

    if !content.contains(START_MARKER) {
        return Ok(());
    }

    let mut filtered_lines = Vec::new();
    let mut inside_block = false;

    for line in content.lines() {
        if line.trim() == START_MARKER {
            inside_block = true;
            continue;
        }
        if line.trim() == END_MARKER {
            inside_block = false;
            continue;
        }
        if !inside_block {
            filtered_lines.push(line);
        }
    }

    let new_content = filtered_lines.join("\n") + "\n";
    fs::write(hosts_path, new_content)?;

    // 🚀 Limpa o cache de DNS para que o desbloqueio seja instantâneo
    flush_dns_cache();

    println!("[Nostak] Domínios desbloqueados e cache de DNS limpo!");
    Ok(())
}