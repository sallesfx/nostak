use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::Path;

const START_MARKER: &str = "# --- NOSTAK BLOCK START ---";
const END_MARKER: &str = "# --- NOSTAK BLOCK END ---";

pub fn get_hosts_path() -> &'static str {
    if cfg!(target_os = "windows") {
        r"C:\Windows\System32\drivers\etc\hosts"
    } else {
        "/etc/hosts"
    }
}

pub fn create_backup() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let backup_path = format!("{}.nostak.bak", hosts_path);

    if !Path::new(&backup_path).exists() {
        fs::copy(hosts_path, &backup_path)?;
        println!("[Nostak] Backup do arquivo hosts criado em: {}", backup_path);
    }
    Ok(())
}

pub fn block_domains(domains: &[&str]) -> io::Result<()> {
    create_backup()?;
    let hosts_path = get_hosts_path();
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

    println!("[Nostak] Domínios bloqueados com sucesso!");
    Ok(())
}

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

    println!("[Nostak] Domínios desbloqueados com sucesso!");
    Ok(())
}