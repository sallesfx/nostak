use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::Path;

// Marcadores para identificar com precisão o que o Nostak inseriu no arquivo
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
    // Garante que o backup existe
    create_backup()?;

    let hosts_path = get_hosts_path();

    // Antes de bloquear, limpa bloqueios antigos caso tenham sobrado de uma execução anterior
    unblock_domains()?;

    let mut content = String::new();
    File::open(hosts_path)?.read_to_string(&mut content)?;

    let mut new_block = String::new();
    new_block.push_str(&format!("\n{}\n", START_MARKER));

    for domain in domains {
        // Bloqueia o domínio principal e a variação com www
        new_block.push_str(&format!("127.0.0.1 {}\n", domain));
        if !domain.starts_with("www.") {
            new_block.push_str(&format!("127.0.0.1 www.{}\n", domain));
        }
    }

    new_block.push_str(&format!("{}\n", END_MARKER));

    // Anexa a nova seção de bloqueio ao final do arquivo hosts
    let mut file = OpenOptions::new().append(true).open(hosts_path)?;
    file.write_all(new_block.as_bytes())?;

    println!("[Nostak] Domínios bloqueados com sucesso!");
    Ok(())
}

/// Remove o bloco de domínios bloqueados pelo Nostak do arquivo hosts
pub fn unblock_domains() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let mut content = String::new();

    File::open(hosts_path)?.read_to_string(&mut content)?;

    // Se o marcador do Nostak não estiver no arquivo, não há nada a remover
    if !content.contains(START_MARKER) {
        return Ok(());
    }

    // Filtra e remove todas as linhas entre o START_MARKER e o END_MARKER
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

    // Reescreve o arquivo sem o bloco do Nostak
    let new_content = filtered_lines.join("\n") + "\n";
    fs::write(hosts_path, new_content)?;

    println!("[Nostak] Domínios desbloqueados com sucesso!");
    Ok(())
}