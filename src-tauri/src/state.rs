use crate::config::Config;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};

#[derive(Clone)]
pub struct AppState {
    config: Arc<RwLock<Config>>,
    io_lock: Arc<Mutex<()>>,
    custom_path: Option<PathBuf>,
    persist_on_mutate: bool,
}

impl AppState {
    #[allow(dead_code)]
    pub fn new(config: Config) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
            io_lock: Arc::new(Mutex::new(())),
            custom_path: None,
            persist_on_mutate: true,
        }
    }

    #[cfg(test)]
    pub fn new_in_memory(config: Config) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
            io_lock: Arc::new(Mutex::new(())),
            custom_path: None,
            persist_on_mutate: false,
        }
    }

    pub fn new_with_path(config: Config, path: PathBuf) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
            io_lock: Arc::new(Mutex::new(())),
            custom_path: Some(path),
            persist_on_mutate: true,
        }
    }

    fn persist_internal(&self, config: &Config) -> Result<(), String> {
        if !self.persist_on_mutate {
            return Ok(());
        }

        // Serializa a persistência em disco sem reter a trava de leitura em memória (RwLock)
        let _guard = self
            .io_lock
            .lock()
            .map_err(|e| format!("Poisoned io_lock: {}", e))?;

        let res = match &self.custom_path {
            Some(path) => config.save_atomic_to(path),
            None => config.save_atomic(),
        };

        res.map_err(|e| format!("Falha ao salvar configuração: {}", e))
    }

    pub fn get_config(&self) -> Result<Config, String> {
        let lock = self
            .config
            .read()
            .map_err(|e| format!("Poisoned lock: {}", e))?;
        Ok(lock.clone())
    }

    pub fn mutate<F>(&self, mutation: F) -> Result<Config, String>
    where
        F: FnOnce(&mut Config),
    {
        // 1. Executa mutação atômica em memória e libera imediatamente o WriteGuard
        let cloned_config = {
            let mut lock = self
                .config
                .write()
                .map_err(|e| format!("Poisoned lock: {}", e))?;
            mutation(&mut lock);
            lock.clone()
        };

        // 2. Persiste em disco fora da seção crítica do RwLock
        self.persist_internal(&cloned_config)?;
        Ok(cloned_config)
    }

    pub fn mutate_result<F, R, E>(&self, mutation: F) -> Result<(Config, R), String>
    where
        F: FnOnce(&mut Config) -> Result<R, E>,
        E: ToString,
    {
        // 1. Executa mutação falível atômica em memória e libera imediatamente o WriteGuard
        let (cloned_config, res) = {
            let mut lock = self
                .config
                .write()
                .map_err(|e| format!("Poisoned lock: {}", e))?;
            let res = mutation(&mut lock).map_err(|e| e.to_string())?;
            (lock.clone(), res)
        };

        // 2. Persiste em disco fora da seção crítica do RwLock
        self.persist_internal(&cloned_config)?;
        Ok((cloned_config, res))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::thread;

    #[test]
    fn test_app_state_concurrency_in_memory() {
        let state = AppState::new_in_memory(Config::default());
        let mut handles = vec![];

        // Dispara 10 threads concorrentes adicionando tarefas simultaneamente
        for i in 0..10 {
            let state_clone = state.clone();
            let handle = thread::spawn(move || {
                let _ = state_clone.mutate(|cfg| {
                    cfg.adicionar_tarefa(
                        format!("Tarefa Concorrente {}", i),
                        "Foco".to_string(),
                        1,
                    );
                });
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }

        let final_cfg = state.get_config().unwrap();
        // Config padrão tem 4 tarefas, com mais 10 concorrentes deve ter 14
        assert_eq!(final_cfg.tarefas.len(), 14);
    }

    #[test]
    fn test_app_state_mutate_with_file_persistence() {
        let temp_dir = std::env::temp_dir();
        let target_file = temp_dir.join("nostak_test_state_atomic.toml");

        let state = AppState::new_with_path(Config::default(), target_file.clone());
        let res = state.mutate(|cfg| {
            cfg.tempo_foco_minutos = 50;
        });

        assert!(res.is_ok());
        assert_eq!(res.unwrap().tempo_foco_minutos, 50);

        let content = fs::read_to_string(&target_file).unwrap();
        assert!(content.contains("tempo_foco_minutos = 50"));

        let _ = fs::remove_file(target_file);
    }

    #[test]
    fn test_app_state_rwlock_concurrent_readers_and_writers() {
        let state = AppState::new_in_memory(Config::default());
        let mut handles = vec![];

        // 10 threads leitoras simultâneas
        for _ in 0..10 {
            let state_clone = state.clone();
            handles.push(thread::spawn(move || {
                for _ in 0..50 {
                    let cfg = state_clone.get_config();
                    assert!(cfg.is_ok());
                }
            }));
        }

        // 5 threads escritoras simultâneas
        for i in 0..5 {
            let state_clone = state.clone();
            handles.push(thread::spawn(move || {
                let res = state_clone.mutate(|cfg| {
                    cfg.adicionar_site_personalizado(format!("site{}.com", i));
                });
                assert!(res.is_ok());
            }));
        }

        for h in handles {
            h.join().unwrap();
        }

        let final_cfg = state.get_config().unwrap();
        assert_eq!(final_cfg.sites_personalizados.len(), 5);
    }
}
