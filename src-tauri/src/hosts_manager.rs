use std::collections::HashSet;
use std::fs;
use std::io;
use std::path::Path;
use std::process::Command; // 🛠️ Módulo nativo para executar comandos no SO

const START_MARKER: &str = "# --- NOSTAK BLOCK START ---";
const END_MARKER: &str = "# --- NOSTAK BLOCK END ---";

/// Valida e normaliza estritamente um domínio conforme RFC 1035 / RFC 1123,
/// prevenindo ataques de CRLF injection, null bytes e DNS hijacking em /etc/hosts.
pub fn validate_and_normalize_domain(raw: &str) -> Result<(String, String), String> {
    if raw.contains('\n') || raw.contains('\r') || raw.contains('\0') {
        return Err("Caractere de quebra de linha ou byte nulo detectado no domínio.".into());
    }

    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("Domínio não pode ser vazio.".into());
    }

    if trimmed.contains(' ') || trimmed.contains('\t') {
        return Err("Espaço ou tabulação detectado no domínio.".into());
    }

    let clean = trimmed
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split('/')
        .next()
        .unwrap_or("")
        .to_lowercase();

    let root = if clean.starts_with("www.") {
        clean[4..].to_string()
    } else {
        clean
    };

    // Validação estrita de label DNS (RFC 1035 / RFC 1123)
    let is_valid = !root.is_empty()
        && root.len() <= 253
        && root.contains('.')
        && root.split('.').all(|label| {
            !label.is_empty()
                && label.len() <= 63
                && label.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
                && !label.starts_with('-')
                && !label.ends_with('-')
        });

    if !is_valid {
        return Err(format!("Formato de FQDN inválido: {}", root));
    }

    let www = format!("www.{}", root);
    Ok((root, www))
}

/// Helper para retrocompatibilidade interna
#[allow(dead_code)]
pub fn normalize_domain(domain: &str) -> (String, String) {
    validate_and_normalize_domain(domain).unwrap_or_else(|_| (String::new(), String::new()))
}

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

/// Tenta escrever o conteúdo no arquivo hosts; se falhar por permissão, tenta elevação via pkexec no Linux
fn write_hosts_file(new_content: &str) -> io::Result<()> {
    let hosts_path = get_hosts_path();

    // Tenta escrita direta (caso o app esteja com permissão de escrita)
    match fs::write(hosts_path, new_content) {
        Ok(_) => Ok(()),
        Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
            if cfg!(target_os = "linux") {
                let temp_path = "/tmp/nostak_hosts_temp";
                fs::write(temp_path, new_content)?;

                let status = Command::new("pkexec")
                    .args(["cp", temp_path, hosts_path])
                    .status();

                let _ = fs::remove_file(temp_path);

                match status {
                    Ok(s) if s.success() => Ok(()),
                    _ => Err(io::Error::new(
                        io::ErrorKind::PermissionDenied,
                        "Permissão negada. É necessário autorizar o acesso de administrador para alterar o arquivo hosts.",
                    )),
                }
            } else {
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Permissão negada. Execute o aplicativo como Administrador para alterar o arquivo hosts.",
                ))
            }
        }
        Err(e) => Err(e),
    }
}

/// Cria um backup do arquivo hosts original antes de qualquer alteração
pub fn create_backup() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let backup_path = format!("{}.nostak.bak", hosts_path);

    if !Path::new(&backup_path).exists() {
        if let Ok(content) = fs::read_to_string(hosts_path) {
            let _ = fs::write(&backup_path, content);
        }
    }
    Ok(())
}

/// Adiciona uma lista de sites ao arquivo hosts apontando para 127.0.0.1
pub fn block_domains(domains: &[&str]) -> io::Result<()> {
    create_backup()?;

    let hosts_path = get_hosts_path();
    let raw_content = fs::read_to_string(hosts_path).unwrap_or_default();

    // Remove qualquer bloco anterior do Nostak para evitar duplicatas
    let mut base_lines = Vec::new();
    let mut inside_block = false;
    for line in raw_content.lines() {
        if line.trim() == START_MARKER {
            inside_block = true;
            continue;
        }
        if line.trim() == END_MARKER {
            inside_block = false;
            continue;
        }
        if !inside_block {
            base_lines.push(line);
        }
    }

    let mut domain_set = HashSet::new();
    for domain in domains {
        if let Ok((root, www)) = validate_and_normalize_domain(domain) {
            domain_set.insert(root);
            domain_set.insert(www);
        }
    }

    let mut new_block = String::new();
    new_block.push_str(&format!("{}\n", START_MARKER));
    for domain in domain_set {
        new_block.push_str(&format!("127.0.0.1 {}\n", domain));
    }
    new_block.push_str(END_MARKER);

    let mut full_text = base_lines.join("\n");
    if !full_text.ends_with('\n') {
        full_text.push('\n');
    }
    full_text.push_str(&new_block);
    full_text.push('\n');

    write_hosts_file(&full_text)?;
    flush_dns_cache();

    println!("[Nostak] Domínios bloqueados e cache de DNS limpo!");
    Ok(())
}

/// Verifica se existem bloqueios ativos do Nostak no arquivo hosts
pub fn has_active_blocks() -> bool {
    let hosts_path = get_hosts_path();
    match fs::read_to_string(hosts_path) {
        Ok(content) => content.contains(START_MARKER),
        Err(_) => false,
    }
}

/// Remove o bloco de domínios bloqueados pelo Nostak do arquivo hosts
pub fn unblock_domains() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let content = match fs::read_to_string(hosts_path) {
        Ok(c) => c,
        Err(_) => return Ok(()),
    };

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
    write_hosts_file(&new_content)?;
    flush_dns_cache();

    println!("[Nostak] Domínios desbloqueados e cache de DNS limpo!");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_domain() {
        assert_eq!(
            normalize_domain("https://www.YouTube.com/watch?v=123"),
            ("youtube.com".to_string(), "www.youtube.com".to_string())
        );
        assert_eq!(
            normalize_domain("  reddit.com/r/rust "),
            ("reddit.com".to_string(), "www.reddit.com".to_string())
        );
    }

    #[test]
    fn test_validate_and_normalize_domain_security() {
        // Domínios válidos
        assert_eq!(
            validate_and_normalize_domain("https://www.globo.com/noticias"),
            Ok(("globo.com".to_string(), "www.globo.com".to_string()))
        );
        assert_eq!(
            validate_and_normalize_domain("sub.dominio.co.uk"),
            Ok(("sub.dominio.co.uk".to_string(), "www.sub.dominio.co.uk".to_string()))
        );

        // Bloqueio de CRLF Injection e Quebra de Linha
        assert!(validate_and_normalize_domain("example.com\n192.168.1.50 evil.com").is_err());
        assert!(validate_and_normalize_domain("example.com\r\n0.0.0.0 bad.org").is_err());
        assert!(validate_and_normalize_domain("example.com\r").is_err());
        assert!(validate_and_normalize_domain("example.com\0evil.com").is_err());

        // Bloqueio de espaços e caracteres inválidos
        assert!(validate_and_normalize_domain("example .com").is_err());
        assert!(validate_and_normalize_domain("example.com 127.0.0.1").is_err());

        // Bloqueio de violações RFC 1035 / 1123
        assert!(validate_and_normalize_domain("-badlabel.com").is_err());
        assert!(validate_and_normalize_domain("badlabel-.com").is_err());
        assert!(validate_and_normalize_domain("localhost").is_err()); // Deve conter '.'
        assert!(validate_and_normalize_domain("").is_err());
    }
}