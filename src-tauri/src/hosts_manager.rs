use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{self, Write};
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

    let root = if let Some(stripped) = clean.strip_prefix("www.") {
        stripped.to_string()
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

/// Escreve de forma atômica no arquivo de destino utilizando arquivo temporário
/// com fsync e renomeação atômica (renameat no POSIX / MoveFileExW no Windows).
pub fn write_atomic_system_file(dest_path: &str, content: &str) -> io::Result<()> {
    let target = Path::new(dest_path);
    let parent = target.parent().unwrap_or_else(|| Path::new("/"));
    let temp_path = parent.join(format!(".nostak_hosts_{}.tmp", std::process::id()));

    {
        let mut temp_file = File::create(&temp_path)?;
        temp_file.write_all(content.as_bytes())?;
        temp_file.sync_all()?; // Garante flushing dos buffers para o hardware (fsync)
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = fs::metadata(dest_path) {
            let mut perms = meta.permissions();
            perms.set_mode(0o644);
            let _ = fs::set_permissions(&temp_path, perms);
        }
    }

    fs::rename(&temp_path, target).inspect_err(|_| {
        let _ = fs::remove_file(&temp_path);
    })
}

/// Elevação segura usando stdin do pkexec (evita criação de arquivos em /tmp e elimina TOCTOU/symlink attack)
#[cfg(target_os = "linux")]
fn write_hosts_elevated(hosts_path: &str, new_content: &str) -> io::Result<()> {
    use std::process::Stdio;

    let mut child = Command::new("pkexec")
        .args(["tee", hosts_path])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(new_content.as_bytes())?;
        stdin.flush()?;
    }

    let output = child.wait_with_output()?;
    if !output.status.success() {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            format!(
                "pkexec falhou: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            ),
        ));
    }

    Ok(())
}

/// Escreve no arquivo hosts de forma atômica e segura.
/// Se faltarem privilégios, eleva via canal seguro stdin com pkexec no Linux.
fn write_hosts_file(new_content: &str) -> io::Result<()> {
    let hosts_path = get_hosts_path();

    match write_atomic_system_file(hosts_path, new_content) {
        Ok(_) => Ok(()),
        Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
            #[cfg(target_os = "linux")]
            {
                write_hosts_elevated(hosts_path, new_content)
            }
            #[cfg(not(target_os = "linux"))]
            {
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Permissão negada. Execute o aplicativo como Administrador para alterar o arquivo hosts.",
                ))
            }
        }
        Err(e) => Err(e),
    }
}

/// Cria ou atualiza o backup do arquivo hosts original antes de qualquer alteração,
/// garantindo que reflita o estado seguro limpo pré-sessão.
pub fn create_backup() -> io::Result<()> {
    let hosts_path = get_hosts_path();
    let backup_path = format!("{}.nostak.bak", hosts_path);

    if let Ok(content) = fs::read_to_string(hosts_path) {
        if !Path::new(&backup_path).exists()
            || (!content.contains(START_MARKER) && !content.is_empty())
        {
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
            Ok((
                "sub.dominio.co.uk".to_string(),
                "www.sub.dominio.co.uk".to_string()
            ))
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

    #[test]
    fn test_write_atomic_system_file() {
        let temp_dir = std::env::temp_dir();
        let target_path = temp_dir.join(format!(
            "nostak_atomic_hosts_test_{}.txt",
            std::process::id()
        ));
        let dest_str = target_path.to_str().unwrap();

        let initial_content = "127.0.0.1 localhost\n::1 localhost\n";
        assert!(write_atomic_system_file(dest_str, initial_content).is_ok());

        assert!(target_path.exists());
        let read_back = fs::read_to_string(&target_path).unwrap();
        assert_eq!(read_back, initial_content);

        // Atualização atômica subsequente
        let updated_content = "127.0.0.1 localhost\n127.0.0.1 nostak.local\n";
        assert!(write_atomic_system_file(dest_str, updated_content).is_ok());

        let read_back_updated = fs::read_to_string(&target_path).unwrap();
        assert_eq!(read_back_updated, updated_content);

        // Limpeza
        let _ = fs::remove_file(target_path);
    }
}
