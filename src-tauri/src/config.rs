use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub tempo_foco_minutos: u64,
    pub tempo_pausa_minutos: u64,
    pub categorias_ativas: Vec<String>,
    pub sites_personalizados: Vec<String>,
    pub categorias: HashMap<String, Vec<String>>,
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
            categorias_ativas: vec![
                "redes_sociais".to_string(),
                "streaming_e_videos".to_string(),
            ],
            sites_personalizados: vec![],
            categorias,
        }
    }
}

impl Config {
    pub fn get_config_path() -> &'static str {
        if Path::new("config.toml").exists() {
            "config.toml"
        } else if Path::new("../config.toml").exists() {
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
}