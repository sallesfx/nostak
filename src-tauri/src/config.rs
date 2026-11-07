use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

fn default_true() -> bool {
    true
}

fn default_one() -> u64 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tarefa {
    pub id: u64,
    pub texto: String,
    pub categoria: String,
    pub concluida: bool,
    #[serde(default = "default_one")]
    pub sessoes_estimadas: u64,
    #[serde(default)]
    pub sessoes_concluidas: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TemplateItem {
    pub texto: String,
    pub categoria: String,
    #[serde(default = "default_one")]
    pub sessoes_estimadas: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TemplateTarefa {
    pub nome: String,
    pub itens: Vec<TemplateItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct Progresso {
    pub total_minutos_foco: u64,
    pub sessoes_concluidas: u64,
    pub sessoes_interrompidas: u64,
    pub maior_sessao_minutos: u64,
    pub sereias_silenciadas: u64,
}

pub fn default_tarefas() -> Vec<Tarefa> {
    vec![
        Tarefa {
            id: 1,
            texto: "Mapear rota de águas profundas".to_string(),
            categoria: "Rotina".to_string(),
            concluida: true,
            sessoes_estimadas: 1,
            sessoes_concluidas: 1,
        },
        Tarefa {
            id: 2,
            texto: "Limpar convés de distrações digitais".to_string(),
            categoria: "Urgente".to_string(),
            concluida: false,
            sessoes_estimadas: 1,
            sessoes_concluidas: 0,
        },
        Tarefa {
            id: 3,
            texto: "Calibrar sextante de produtividade".to_string(),
            categoria: "Rotina".to_string(),
            concluida: false,
            sessoes_estimadas: 2,
            sessoes_concluidas: 0,
        },
        Tarefa {
            id: 4,
            texto: "Navegar por 45 min sem interrupção".to_string(),
            categoria: "Foco".to_string(),
            concluida: false,
            sessoes_estimadas: 2,
            sessoes_concluidas: 0,
        },
    ]
}

pub fn default_templates() -> Vec<TemplateTarefa> {
    vec![
        TemplateTarefa {
            nome: "Alemão".to_string(),
            itens: vec![
                TemplateItem {
                    texto: "Leitura e vocabulário em alemão".to_string(),
                    categoria: "Foco".to_string(),
                    sessoes_estimadas: 1,
                },
                TemplateItem {
                    texto: "Gramática e exercícios práticos".to_string(),
                    categoria: "Rotina".to_string(),
                    sessoes_estimadas: 2,
                },
            ],
        },
        TemplateTarefa {
            nome: "Matemática".to_string(),
            itens: vec![
                TemplateItem {
                    texto: "Estudo de teoria e conceitos".to_string(),
                    categoria: "Foco".to_string(),
                    sessoes_estimadas: 2,
                },
                TemplateItem {
                    texto: "Prática e resolução de exercícios".to_string(),
                    categoria: "Urgente".to_string(),
                    sessoes_estimadas: 3,
                },
            ],
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Config {
    pub tempo_foco_minutos: u64,
    pub tempo_pausa_minutos: u64,
    #[serde(default = "default_true")]
    pub som_ativo: bool,
    #[serde(default = "default_true")]
    pub auto_iniciar_descanso: bool,
    #[serde(default)]
    pub tarefa_ativa_id: Option<u64>,
    pub categorias_ativas: Vec<String>,
    pub sites_personalizados: Vec<String>,
    pub categorias: HashMap<String, Vec<String>>,
    #[serde(default = "default_tarefas")]
    pub tarefas: Vec<Tarefa>,
    #[serde(default = "default_templates")]
    pub templates_tarefas: Vec<TemplateTarefa>,
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
            tarefa_ativa_id: Some(2),
            categorias_ativas: vec![
                "redes_sociais".to_string(),
                "streaming_e_videos".to_string(),
            ],
            sites_personalizados: vec![],
            categorias,
            tarefas: default_tarefas(),
            templates_tarefas: default_templates(),
            progresso: Progresso::default(),
        }
    }
}

/// Resolve o caminho canônico do arquivo de configuração do Nostak.
/// Em modo debug/desenvolvimento, prioriza o config.toml local do workspace se existir.
/// Em produção/distribuição, utiliza os diretórios canônicos do SO (XDG ~/.config no Linux, %APPDATA% no Windows).
pub fn resolve_config_path(app: &tauri::AppHandle) -> Result<PathBuf, io::Error> {
    use tauri::Manager;

    #[cfg(debug_assertions)]
    {
        if Path::new("../config.toml").exists() {
            return Ok(PathBuf::from("../config.toml"));
        } else if Path::new("config.toml").exists() {
            return Ok(PathBuf::from("config.toml"));
        }
    }

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| io::Error::new(io::ErrorKind::NotFound, e.to_string()))?;

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)?;
    }
    Ok(config_dir.join("config.toml"))
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

    pub fn load_or_create_from_path<P: AsRef<Path>>(path: P) -> Result<Self, io::Error> {
        let path = path.as_ref();

        if path.exists() {
            let content = fs::read_to_string(path)?;
            let mut config: Config = toml::from_str(&content)
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
            config.garantir_tarefa_ativa_valida();
            Ok(config)
        } else {
            if let Some(parent) = path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent)?;
                }
            }
            let default_config = Config::default();
            let toml_string = toml::to_string_pretty(&default_config)
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;

            fs::write(path, toml_string)?;
            println!("[Nostak] Arquivo '{}' com categorias gerado!", path.display());
            Ok(default_config)
        }
    }

    #[allow(dead_code)]
    pub fn load_or_create() -> Result<Self, io::Error> {
        Self::load_or_create_from_path(Path::new(Self::get_config_path()))
    }

    pub fn save_atomic_to<P: AsRef<Path>>(&self, path: P) -> Result<(), io::Error> {
        let path = path.as_ref();
        let toml_string = toml::to_string_pretty(self)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        let tmp_path = match path.file_name() {
            Some(fname) => {
                let mut tmp_name = fname.to_os_string();
                tmp_name.push(".tmp");
                path.with_file_name(tmp_name)
            }
            None => path.with_extension("tmp"),
        };
        fs::write(&tmp_path, &toml_string)?;
        fs::rename(&tmp_path, path)?;
        Ok(())
    }

    pub fn save_atomic(&self) -> Result<(), io::Error> {
        self.save_atomic_to(Self::get_config_path())
    }

    #[allow(dead_code)]
    pub fn save(&self) -> Result<(), io::Error> {
        self.save_atomic()
    }

    pub fn garantir_tarefa_ativa_valida(&mut self) {
        if let Some(active_id) = self.tarefa_ativa_id {
            let valida = self
                .tarefas
                .iter()
                .any(|t| t.id == active_id && !t.concluida);
            if valida {
                return;
            }
        }
        self.tarefa_ativa_id = self
            .tarefas
            .iter()
            .find(|t| !t.concluida)
            .map(|t| t.id);
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

    pub fn adicionar_tarefa(
        &mut self,
        texto: String,
        categoria: String,
        sessoes_estimadas: u64,
    ) -> Option<Tarefa> {
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
            sessoes_estimadas: sessoes_estimadas.max(1),
            sessoes_concluidas: 0,
        };
        self.tarefas.push(nova.clone());
        self.garantir_tarefa_ativa_valida();
        Some(nova)
    }

    pub fn selecionar_tarefa_ativa(&mut self, id: Option<u64>) {
        if let Some(target_id) = id {
            if let Some(t) = self.tarefas.iter_mut().find(|t| t.id == target_id) {
                if t.concluida {
                    t.concluida = false;
                }
                self.tarefa_ativa_id = Some(target_id);
                return;
            }
        }
        self.tarefa_ativa_id = None;
    }

    pub fn alternar_tarefa(&mut self, id: u64, concluida: bool) {
        if let Some(tarefa) = self.tarefas.iter_mut().find(|t| t.id == id) {
            tarefa.concluida = concluida;
            if concluida && tarefa.sessoes_concluidas < tarefa.sessoes_estimadas {
                tarefa.sessoes_concluidas = tarefa.sessoes_estimadas;
            } else if !concluida && tarefa.sessoes_concluidas >= tarefa.sessoes_estimadas {
                tarefa.sessoes_concluidas = 0;
            }
        }
        self.garantir_tarefa_ativa_valida();
    }

    pub fn remover_tarefa(&mut self, id: u64) {
        self.tarefas.retain(|t| t.id != id);
        self.garantir_tarefa_ativa_valida();
    }

    pub fn aplicar_template(&mut self, nome_template: &str, substituir: bool) -> bool {
        let template_opt = self
            .templates_tarefas
            .iter()
            .find(|tpl| tpl.nome.eq_ignore_ascii_case(nome_template.trim()))
            .cloned();

        let Some(template) = template_opt else {
            return false;
        };

        if substituir {
            self.tarefas.clear();
            self.tarefa_ativa_id = None;
        }

        for item in template.itens {
            let _ = self.adicionar_tarefa(item.texto, item.categoria, item.sessoes_estimadas);
        }
        self.garantir_tarefa_ativa_valida();
        true
    }

    pub fn salvar_template_de_tarefas_atuais(&mut self, nome: String) -> bool {
        let clean_nome = nome.trim().to_string();
        if clean_nome.is_empty() || self.tarefas.is_empty() {
            return false;
        }

        let itens: Vec<TemplateItem> = self
            .tarefas
            .iter()
            .map(|t| TemplateItem {
                texto: t.texto.clone(),
                categoria: t.categoria.clone(),
                sessoes_estimadas: t.sessoes_estimadas.max(1),
            })
            .collect();

        if let Some(existing) = self
            .templates_tarefas
            .iter_mut()
            .find(|tpl| tpl.nome.eq_ignore_ascii_case(&clean_nome))
        {
            existing.nome = clean_nome;
            existing.itens = itens;
        } else {
            self.templates_tarefas.push(TemplateTarefa {
                nome: clean_nome,
                itens,
            });
        }
        true
    }

    pub fn remover_template(&mut self, nome: &str) {
        let clean = nome.trim();
        self.templates_tarefas
            .retain(|tpl| !tpl.nome.eq_ignore_ascii_case(clean));
    }

    pub fn registrar_sessao_concluida(&mut self, minutos_foco: u64) {
        let bloqueados = self.get_all_blocked_sites().len() as u64;
        self.progresso.total_minutos_foco += minutos_foco;
        self.progresso.sessoes_concluidas += 1;
        if minutos_foco > self.progresso.maior_sessao_minutos {
            self.progresso.maior_sessao_minutos = minutos_foco;
        }
        self.progresso.sereias_silenciadas += bloqueados;

        // Avança uma sessão de Pomodoro na tarefa ativa (ou na primeira pendente)
        self.garantir_tarefa_ativa_valida();
        if let Some(active_id) = self.tarefa_ativa_id {
            if let Some(tarefa) = self.tarefas.iter_mut().find(|t| t.id == active_id) {
                tarefa.sessoes_concluidas += 1;
                if tarefa.sessoes_concluidas >= tarefa.sessoes_estimadas {
                    tarefa.concluida = true;
                }
            }
        }
        self.garantir_tarefa_ativa_valida();
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
    fn test_gerenciar_tarefas_e_sessoes() {
        let mut cfg = Config::default();
        cfg.tarefas.clear();
        cfg.tarefa_ativa_id = None;

        let criada = cfg.adicionar_tarefa("Estudar Alemão".to_string(), "Foco".to_string(), 2);
        assert!(criada.is_some());
        let id = criada.unwrap().id;
        assert_eq!(cfg.tarefa_ativa_id, Some(id));

        // 1ª sessão de foco concluída: 1/2 (ainda não concluída)
        cfg.registrar_sessao_concluida(25);
        let t = cfg.tarefas.iter().find(|t| t.id == id).unwrap();
        assert_eq!(t.sessoes_concluidas, 1);
        assert!(!t.concluida);

        // 2ª sessão de foco concluída: 2/2 (concluída automaticamente!)
        cfg.registrar_sessao_concluida(25);
        let t = cfg.tarefas.iter().find(|t| t.id == id).unwrap();
        assert_eq!(t.sessoes_concluidas, 2);
        assert!(t.concluida);
        assert_eq!(cfg.tarefa_ativa_id, None);
    }

    #[test]
    fn test_templates_de_tarefas() {
        let mut cfg = Config::default();
        assert!(cfg.aplicar_template("Matemática", true));
        assert_eq!(cfg.tarefas.len(), 2);
        assert_eq!(cfg.tarefas[0].sessoes_estimadas, 2);
        assert_eq!(cfg.tarefas[1].sessoes_estimadas, 3);

        assert!(cfg.salvar_template_de_tarefas_atuais("Meu Plano".to_string()));
        assert!(cfg.templates_tarefas.iter().any(|t| t.nome == "Meu Plano"));

        cfg.remover_template("Meu Plano");
        assert!(!cfg.templates_tarefas.iter().any(|t| t.nome == "Meu Plano"));
    }

    #[test]
    fn test_preferencias_e_reset_progresso() {
        let mut cfg = Config::default();
        cfg.atualizar_preferencias(false, false);
        assert!(!cfg.som_ativo);
        assert!(!cfg.auto_iniciar_descanso);

        cfg.registrar_sessao_concluida(60);
        assert_eq!(cfg.progresso.total_minutos_foco, 60);

        cfg.resetar_progresso();
        assert_eq!(cfg.progresso.total_minutos_foco, 0);
    }

    #[test]
    fn test_save_atomic_persistencia() {
        let temp_dir = std::env::temp_dir();
        let target_file = temp_dir.join("nostak_test_config_atomic.toml");
        let tmp_file = temp_dir.join("nostak_test_config_atomic.toml.tmp");

        let mut cfg = Config::default();
        cfg.tempo_foco_minutos = 42;
        assert!(cfg.save_atomic_to(&target_file).is_ok());

        assert!(target_file.exists());
        assert!(!tmp_file.exists()); // O arquivo temporário deve ter sido renomeado/removido

        let content = fs::read_to_string(&target_file).unwrap();
        assert!(content.contains("tempo_foco_minutos = 42"));

        let _ = fs::remove_file(target_file);
    }

    #[test]
    fn test_load_or_create_from_path() {
        let temp_dir = std::env::temp_dir();
        let test_subdir = temp_dir.join(format!("nostak_config_test_{}", std::process::id()));
        let test_file = test_subdir.join("config.toml");

        // 1. Cria em diretório novo que ainda não existe
        let loaded = Config::load_or_create_from_path(&test_file);
        assert!(loaded.is_ok());
        assert!(test_file.exists());

        // 2. Modifica e recarrega do caminho especificado
        let mut cfg = loaded.unwrap();
        cfg.tempo_foco_minutos = 55;
        assert!(cfg.save_atomic_to(&test_file).is_ok());

        let reloaded = Config::load_or_create_from_path(&test_file).unwrap();
        assert_eq!(reloaded.tempo_foco_minutos, 55);

        let _ = fs::remove_dir_all(test_subdir);
    }
}
