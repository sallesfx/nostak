use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tarefa {
    pub id: u64,
    pub texto: String,
    pub categoria: String,
    pub concluida: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct Progresso {
    pub total_minutos_foco: u64,
    pub sessoes_concluidas: u64,
    pub sessoes_interrompidas: u64,
    pub maior_sessao_minutos: u64,
    pub sereias_silenciadas: u64,
}

fn default_true() -> bool {
    true
}

pub fn default_tarefas() -> Vec<Tarefa> {
    vec![
        Tarefa {
            id: 1,
            texto: "Mapear rota de águas profundas".to_string(),
            categoria: "Rotina".to_string(),
            concluida: true,
        },
        Tarefa {
            id: 2,
            texto: "Limpar convés de distrações digitais".to_string(),
            categoria: "Urgente".to_string(),
            concluida: false,
        },
        Tarefa {
            id: 3,
            texto: "Calibrar sextante de produtividade".to_string(),
            categoria: "Rotina".to_string(),
            concluida: false,
        },
        Tarefa {
            id: 4,
            texto: "Navegar por 45 min sem interrupção".to_string(),
            categoria: "Foco".to_string(),
            concluida: false,
        },
    ]
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub tempo_foco_minutos: u64,
    pub tempo_pausa_minutos: u64,
    #[serde(default = "default_true")]
    pub som_ativo: bool,
    #[serde(default = "default_true")]
    pub auto_iniciar_descanso: bool,
    pub categorias_ativas: Vec<String>,
    pub sites_personalizados: Vec<String>,
    pub categorias: HashMap<String, Vec<String>>,
    #[serde(default = "default_tarefas")]
    pub tarefas: Vec<Tarefa>,
    #[serde(default)]
    pub progresso: Progresso,
}

impl Default for Config {
    fn default() -> Self {
        let mut categorias = HashMap::new();

        categorias.insert(
            "redes_sociais".to_string(),
            vec![
                "instagram.com".to_string(),
                "x.com".to_string(),
                "twitter.com".to_string(),
                "tiktok.com".to_string(),
                "facebook.com".to_string(),
                "reddit.com".to_string(),
            ],
        );

        categorias.insert(
            "streaming_e_videos".to_string(),
            vec![
                "youtube.com".to_string(),
                "netflix.com".to_string(),
                "twitch.tv".to_string(),
                "primevideo.com".to_string(),
            ],
        );

        categorias.insert(
            "noticias_e_portais".to_string(),
            vec![
                "g1.globo.com".to_string(),
                "uol.com.br".to_string(),
                "ge.globo.com".to_string(),
                "cnnbrasil.com.br".to_string(),
            ],
        );

        categorias.insert(
            "jogos".to_string(),
            vec![
                "steamcommunity.com".to_string(),
                "roblox.com".to_string(),
                "epicgames.com".to_string(),
                "discord.com".to_string(),
            ],
        );

        Self {
            tempo_foco_minutos: 25,
            tempo_pausa_minutos: 5,
            som_ativo: true,
            auto_iniciar_descanso: true,
            categorias_ativas: vec![
                "redes_sociais".to_string(),
                "streaming_e_videos".to_string(),
            ],
            sites_personalizados: vec![],
            categorias,
            tarefas: default_tarefas(),
            progresso: Progresso::default(),
        }
    }
}

impl Config {
    /// Prioriza o `config.toml` na raiz do projeto (mesmo quando executado a partir de `src-tauri/`).
    pub fn get_config_path() -> &'static str {
        if Path::new("../config.toml").exists() {
            "../config.toml"
        } else {
            "config.toml"
        }
    }

    pub fn load_or_create() -> Result<Self, io::Error> {
        let path = Self::get_config_path();

        if Path::new(path).exists() {
            let content = fs::read_to_string(path)?;
            let config: Config = toml::from_str(&content)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
            Ok(config)
        } else {
            let default_config = Config::default();
            let toml_string = toml::to_string_pretty(&default_config)
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;

            fs::write(path, toml_string)?;
            println!("[Nostak] Arquivo '{}' com categorias gerado!", path);
            Ok(default_config)
        }
    }

    pub fn save(&self) -> Result<(), io::Error> {
        let path = Self::get_config_path();
        let toml_string = toml::to_string_pretty(self)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        fs::write(path, toml_string)?;
        Ok(())
    }

    pub fn alternar_categoria(&mut self, categoria: &str, ativa: bool) {
        if ativa {
            if !self.categorias_ativas.iter().any(|c| c == categoria) {
                self.categorias_ativas.push(categoria.to_string());
            }
        } else {
            self.categorias_ativas.retain(|c| c != categoria);
        }
    }

    pub fn adicionar_site_personalizado(&mut self, site: String) {
        let clean = site.trim().to_lowercase();
        if !clean.is_empty() && !self.sites_personalizados.contains(&clean) {
            self.sites_personalizados.push(clean);
        }
    }

    pub fn remover_site_personalizado(&mut self, site: &str) {
        self.sites_personalizados.retain(|s| s != site);
    }

    pub fn atualizar_tempos(&mut self, foco: u64, pausa: u64) {
        self.tempo_foco_minutos = foco;
        self.tempo_pausa_minutos = pausa;
    }

    pub fn atualizar_preferencias(&mut self, som_ativo: bool, auto_iniciar_descanso: bool) {
        self.som_ativo = som_ativo;
        self.auto_iniciar_descanso = auto_iniciar_descanso;
    }

    pub fn resetar_progresso(&mut self) {
        self.progresso = Progresso::default();
    }

    pub fn adicionar_tarefa(&mut self, texto: String, categoria: String) -> Option<Tarefa> {
        let clean_texto = texto.trim().to_string();
        if clean_texto.is_empty() {
            return None;
        }
        let clean_cat = if categoria.trim().is_empty() {
            "Rotina".to_string()
        } else {
            categoria.trim().to_string()
        };

        let next_id = self.tarefas.iter().map(|t| t.id).max().unwrap_or(0) + 1;
        let nova = Tarefa {
            id: next_id,
            texto: clean_texto,
            categoria: clean_cat,
            concluida: false,
        };
        self.tarefas.push(nova.clone());
        Some(nova)
    }

    pub fn alternar_tarefa(&mut self, id: u64, concluida: bool) {
        if let Some(tarefa) = self.tarefas.iter_mut().find(|t| t.id == id) {
            tarefa.concluida = concluida;
        }
    }

    pub fn remover_tarefa(&mut self, id: u64) {
        self.tarefas.retain(|t| t.id != id);
    }

    pub fn registrar_sessao_concluida(&mut self, minutos_foco: u64) {
        let bloqueados = self.get_all_blocked_sites().len() as u64;
        self.progresso.total_minutos_foco += minutos_foco;
        self.progresso.sessoes_concluidas += 1;
        if minutos_foco > self.progresso.maior_sessao_minutos {
            self.progresso.maior_sessao_minutos = minutos_foco;
        }
        self.progresso.sereias_silenciadas += bloqueados;
    }

    pub fn registrar_sessao_interrompida(&mut self) {
        self.progresso.sessoes_interrompidas += 1;
    }

    pub fn get_all_blocked_sites(&self) -> Vec<String> {
        let mut blocked_set = std::collections::HashSet::new();

        for cat_ativa in &self.categorias_ativas {
            if let Some(sites) = self.categorias.get(cat_ativa) {
                for site in sites {
                    blocked_set.insert(site.clone());
                }
            }
        }

        for site in &self.sites_personalizados {
            blocked_set.insert(site.clone());
        }

        blocked_set.into_iter().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alternar_categoria() {
        let mut cfg = Config::default();
        cfg.alternar_categoria("jogos", true);
        assert!(cfg.categorias_ativas.contains(&"jogos".to_string()));
        cfg.alternar_categoria("jogos", false);
        assert!(!cfg.categorias_ativas.contains(&"jogos".to_string()));
    }

    #[test]
    fn test_adicionar_remover_sereia() {
        let mut cfg = Config::default();
        cfg.adicionar_site_personalizado("reddit.com".to_string());
        assert!(cfg.sites_personalizados.contains(&"reddit.com".to_string()));
        assert!(cfg.get_all_blocked_sites().contains(&"reddit.com".to_string()));

        cfg.remover_site_personalizado("reddit.com");
        assert!(!cfg.sites_personalizados.contains(&"reddit.com".to_string()));
    }

    #[test]
    fn test_atualizar_tempos() {
        let mut cfg = Config::default();
        cfg.atualizar_tempos(45, 10);
        assert_eq!(cfg.tempo_foco_minutos, 45);
        assert_eq!(cfg.tempo_pausa_minutos, 10);
    }

    #[test]
    fn test_gerenciar_tarefas() {
        let mut cfg = Config::default();
        let initial_len = cfg.tarefas.len();

        let criada = cfg.adicionar_tarefa("Estudar Rust".to_string(), "Foco".to_string());
        assert!(criada.is_some());
        let id = criada.unwrap().id;
        assert_eq!(cfg.tarefas.len(), initial_len + 1);

        cfg.alternar_tarefa(id, true);
        assert!(cfg.tarefas.iter().find(|t| t.id == id).unwrap().concluida);

        cfg.remover_tarefa(id);
        assert_eq!(cfg.tarefas.len(), initial_len);
    }

    #[test]
    fn test_registrar_progresso_sessoes() {
        let mut cfg = Config::default();
        let qtd_bloqueados = cfg.get_all_blocked_sites().len() as u64;

        cfg.registrar_sessao_concluida(45);
        assert_eq!(cfg.progresso.total_minutos_foco, 45);
        assert_eq!(cfg.progresso.sessoes_concluidas, 1);
        assert_eq!(cfg.progresso.maior_sessao_minutos, 45);
        assert_eq!(cfg.progresso.sereias_silenciadas, qtd_bloqueados);

        cfg.registrar_sessao_concluida(25);
        assert_eq!(cfg.progresso.total_minutos_foco, 70);
        assert_eq!(cfg.progresso.sessoes_concluidas, 2);
        assert_eq!(cfg.progresso.maior_sessao_minutos, 45);

        cfg.registrar_sessao_interrompida();
        assert_eq!(cfg.progresso.sessoes_interrompidas, 1);
    }

    #[test]
    fn test_preferencias_e_reset_progresso() {
        let mut cfg = Config::default();
        assert!(cfg.som_ativo);
        assert!(cfg.auto_iniciar_descanso);

        cfg.atualizar_preferencias(false, false);
        assert!(!cfg.som_ativo);
        assert!(!cfg.auto_iniciar_descanso);

        cfg.registrar_sessao_concluida(60);
        assert_eq!(cfg.progresso.total_minutos_foco, 60);

        cfg.resetar_progresso();
        assert_eq!(cfg.progresso.total_minutos_foco, 0);
        assert_eq!(cfg.progresso.sessoes_concluidas, 0);
    }
}
