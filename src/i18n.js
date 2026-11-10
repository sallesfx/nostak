/**
 * Sistema de Internacionalização (i18n) do Nostak.
 * Suporte nativo a Português (pt-BR) e Inglês (en-US).
 * Detecta idioma do sistema com fallback preferencial para Inglês.
 */

export const STORAGE_LANG_KEY = 'nostak_lang';

export const translations = {
    pt: {
        meta: {
            title_default: 'Nostak - Navegando pelo Foco Profundo',
            title_focus: '[{time}] Em Alto Mar • Nostak',
            title_break: '[{time}] Porto Seguro • Nostak',
            title_paused: '[Pausado] Porto Seguro • Nostak',
            title_jornada: 'Nostak - A Jornada do Navegador',
            title_blocklist: 'Nostak - Lista de Bloqueio'
        },
        nav: {
            brand_subtitle: 'Navegando pelo Foco',
            journey: 'Jornada',
            timer: 'Temporizador',
            timer_short: 'Tempo',
            blocklist: 'Lista de Bloqueio',
            blocklist_short: 'Bloqueio',
            settings: 'Configurações',
            settings_aria: 'Abrir configurações da embarcação',
            website: 'Site',
            website_title: 'Site Oficial — nostak.app',
            instagram: 'Instagram',
            instagram_title: 'Instagram — @sallesfx'
        },
        settings: {
            dialog_title: 'Configurações da Embarcação',
            close_aria: 'Fechar configurações',
            section_preferences: 'Preferências de Travessia',
            sound_title: 'Sino Náutico (Alerta Sonoro)',
            sound_test: 'Testar',
            sound_desc: 'Tocar badalada suave ao concluir ciclos de foco e descanso.',
            autobreak_title: 'Descanso Automático',
            autobreak_desc: 'Iniciar a contagem de Porto Seguro automaticamente ao finalizar o foco.',
            section_language: 'Idioma / Language',
            language_title: 'Idioma da Embarcação',
            language_desc: 'Alternar entre Inglês e Português na interface.',
            section_times: 'Calibração Padrão (Minutos)',
            focus_time: 'Foco em Alto Mar',
            break_time: 'Pausa em Porto',
            section_maintenance: 'Manutenção e Segurança',
            unblock_emergency: 'Desbloquear Rede (Emergência)',
            reset_progress: 'Zerar Progresso',
            btn_close: 'Fechar',
            btn_save: 'Salvar Alterações',
            feedback_unblocked: 'Todos os sites foram liberados e o cache de rede foi restaurado.',
            feedback_unblock_error: 'Falha ao desbloquear rede: ',
            feedback_reset_success: 'Histórico de progresso da jornada redefinido para zero.',
            feedback_reset_error: 'Erro ao zerar progresso: ',
            feedback_save_error: 'Erro ao salvar configurações: ',
            reset_confirm_title: 'Redefinir Histórico de Viagem',
            reset_confirm_msg: 'Todas as milhas acumuladas, conquistas e sessões concluídas serão apagadas permanentemente.\n\nTem certeza de que deseja zerar seu histórico?',
            reset_confirm_btn: 'Sim, Apagar Tudo',
            reset_cancel_btn: 'Cancelar'
        },
        dialog: {
            confirm_title: 'Confirmação',
            confirm_btn: 'Confirmar',
            cancel_btn: 'Cancelar',
            alert_title: 'Atenção',
            understood_btn: 'Entendido'
        },
        timer: {
            status_idle: 'Aguardando',
            status_focus: 'Em Alto Mar',
            status_break: 'Porto Seguro (Descanso)',
            status_paused: 'Porto Seguro (Pausa)',
            status_completed: 'Viagem Concluída',
            status_error: 'Erro de Permissão',
            idle_subtitle: 'Foco Ininterrupto',
            no_task_idle: 'Nenhuma tarefa atrelada • Selecione no Diário abaixo',
            no_task_empty: 'Nenhuma tarefa atrelada • Adicione no Diário abaixo',
            active_task_prefix: 'Manobra: ',
            sessions_count: '{done}/{total} sessões',
            btn_customize: 'Personalizar',
            btn_start: 'Zarpar',
            btn_pause: 'Ancorar (Pausa)',
            btn_interrupt: 'Interromper Foco',
            btn_resume: 'Retomar Viagem',
            btn_end_break: 'Encerrar Pausa e Focar',
            btn_abort: 'Encerrar',
            btn_new_route: 'Preparar Nova Rota',
            navigating_free_focus: 'Navegando em Foco Livre',
            paused_title: 'Ancorado em Porto Seguro',
            break_title: 'Descanso em Porto Seguro • Sites Liberados',
            interrupted_title: 'Travessia Interrompida',
            interrupted_desc: 'O mar oscilou, mas o leme continua em suas mãos. Reajuste a bússola e tente de novo.',
            custom_title: 'Calibrar Rota de Foco',
            custom_close_aria: 'Fechar modal de calibração',
            custom_focus_label: 'Tempo em Alto Mar (Foco)',
            custom_focus_minus_aria: 'Diminuir tempo de foco em 5 minutos',
            custom_focus_plus_aria: 'Aumentar tempo de foco em 5 minutos',
            custom_break_label: 'Porto de Descanso (Pausa)',
            custom_break_minus_aria: 'Diminuir tempo de pausa em 1 minuto',
            custom_break_plus_aria: 'Aumentar tempo de pausa em 1 minuto',
            custom_cancel: 'Cancelar',
            custom_submit: 'Definir Rota',
            minutes_unit: 'min',
            alert_start_error_title: 'Atenção Navegador',
            alert_start_error_msg: 'Não foi possível erguer as velas e bloquear os sites.\n\nDetalhes: ',
            confirm_interrupt_title: 'Interromper Travessia',
            confirm_interrupt_msg: 'Deseja realmente abandonar a rota em alto mar e retornar ao porto antes do tempo?',
            confirm_interrupt_btn: 'Interromper Foco',
            confirm_interrupt_cancel: 'Continuar Navegando',
            a11y_start: 'Iniciando travessia em Alto Mar. Temporizador de foco ativo por {mins} minutos.',
            a11y_pause: 'Viagem ancorada em Porto Seguro. Bloqueios suspensos temporariamente.',
            a11y_resume: 'Retomando travessia em Alto Mar. Foco reativado.',
            a11y_focus_end_break: 'Ciclo de foco concluído. Iniciando descanso de {mins} minutos em Porto Seguro.',
            a11y_focus_end: 'Ciclo de foco concluído. Embarcação atracada e sites liberados.',
            a11y_break_end: 'Período de descanso em Porto Seguro concluído. Embarcação pronta para zarpar.',
            a11y_interrupted: 'Travessia interrompida pelo navegador.'
        },
        tasks: {
            title: 'Diário do Navegador',
            subtitle: 'Conecte tarefas ao temporizador e acompanhe suas sessões de foco',
            btn_save_template: 'Salvar Template',
            btn_save_template_title: 'Salvar tarefas atuais como um novo Template',
            btn_new_task: 'Nova Tarefa',
            templates_label: 'Templates de Rota (Carregar Tarefas Padrão):',
            template_name_placeholder: 'Nome do template (ex: Alemão, Matemática, Concurso)...',
            template_name_aria: 'Nome do template de tarefas',
            template_cancel: 'Cancelar',
            template_save: 'Salvar Rota',
            input_task_placeholder: 'Ex.: Revisar documentação, rascunhar artigo, resolver exercícios...',
            input_task_aria: 'Descrição da próxima tarefa',
            sessions_aria: 'Quantidade de sessões Pomodoro',
            sessions_title: 'Quantidade de sessões Pomodoro para esta tarefa',
            category_aria: 'Categoria da tarefa',
            session_option_1: '1 Sessão',
            session_option_n: '{count} Sessões',
            category_routine: 'Rotina',
            category_urgent: 'Urgente',
            category_focus: 'Foco',
            btn_cancel: 'Cancelar',
            btn_add: 'Adicionar Tarefa',
            empty_title: 'Seu diário de bordo está vazio.',
            empty_subtitle: 'Adicione sua primeira tarefa acima ou carregue uma rota de estudos pronta.',
            mark_active_aria: 'Vincular tarefa ao temporizador ativo',
            mark_done_aria: 'Concluir tarefa',
            delete_task_aria: 'Excluir tarefa',
            delete_template_aria: 'Excluir template de rota',
            alert_add_error_title: 'Atenção ao Diário',
            alert_add_error_msg: 'Não foi possível adicionar a tarefa: ',
            alert_template_empty_title: 'Diário Vazio',
            alert_template_empty_msg: 'Adicione pelo menos uma tarefa antes de salvar uma rota como template.',
            confirm_load_template_title: 'Carregar Rota de Tarefas',
            confirm_load_template_msg: 'Deseja carregar o template "{name}"?\nSuas tarefas atuais serão substituídas pelas tarefas desta rota.',
            confirm_load_template_btn: 'Carregar Rota',
            confirm_delete_template_title: 'Excluir Template de Rota',
            confirm_delete_template_msg: 'Deseja realmente remover o template "{name}" permanentemente?',
            confirm_delete_template_btn: 'Excluir Template'
        },
        metrics: {
            title: 'Status da Viagem',
            fuel: 'Combustível Mental',
            distance: 'Distância Percorrida',
            wind: 'Vento de Popa',
            wind_calm: 'Calmo',
            wind_steady: 'Constante',
            wind_strong: 'Forte',
            fuel_valuetext: '{value}% de combustível mental',
            distance_valuetext: '{value} milhas náuticas percorridas',
            region_title: 'Região de Navegação',
            satellite_active: 'Satélite Ativo',
            map_alt: 'Carta náutica vetorial do Mar Egeu',
            coordinates: 'COORDENADAS: 37°00\'N 25°00\'E',
            cyclades: 'CÍCLADES • MAR EGEU',
            hours_focus: 'Horas em Foco',
            total_miles: 'Total de Milhas'
        },
        journey: {
            hero_title: 'A Rota para Ítaca',
            hero_subtitle: 'Cada ciclo concluído afasta as distrações e aproxima sua mente do destino final.',
            current_position: 'POSIÇÃO ATUAL',
            map_region_aria: 'Mapa da Rota de Navegação',
            map_svg_aria: 'Mapa estilizado da rota marítima. Posição atual sincronizada com o setor ativo.',
            marker_you: 'VOCÊ',
            stat_miles: 'MILHAS NÁUTICAS DE FOCO',
            stat_sirens: 'DISTRAÇÕES BLOQUEADAS',
            unit_min: 'min',
            unit_sirens: 'sereias',
            mastery_title: 'Domínio do Mar',
            badge_level: 'NÍVEL {level}',
            card1_title: 'Âncora de Aço',
            card1_desc: 'Sustente sessões profundas de até 90 minutos sem interromper o temporizador.',
            card1_meta: 'Recorde atual: {curr} / 90 min',
            card2_title: 'Canto Silenciado',
            card2_desc: 'Neutralize 50 tentativas de distração mantendo suas listas ativas no mar.',
            card2_meta: '{curr} / 50 sereias silenciadas',
            card3_title: 'Capitão do Egeu',
            card3_desc: 'Complete 10 travessias completas de foco sem recuar ao porto.',
            card3_meta: '{curr} / 10 viagens concluídas',
            next_dest: 'Próximo Destino',
            horizon_title: 'O Horizonte da Maestria',
            horizon_desc: 'Mantenha sua disciplina diária para conquistar postos mais altos de navegação e desbloquear novos mapas de foco.',
            btn_sail_now: 'ZARPAR AGORA',
            btn_adjust_blocks: 'AJUSTAR BLOQUEIOS',
            sector_1: 'Setor 01: Baía da Partida',
            sector_2: 'Setor 02: Estreito da Disciplina',
            sector_3: 'Setor 03: Águas de Bronze',
            sector_4: 'Setor 04: Mar de Silêncio',
            sector_5: 'Setor 05: Arquipélago da Maestria'
        },
        blocklist: {
            title: 'Silenciador de Sereias',
            subtitle: 'Bloqueie sites e aplicativos que drenam sua atenção. Durante a travessia, o acesso a estes domínios permanecerá travado no sistema.',
            cat_social: 'Redes Sociais',
            cat_social_sample: 'Instagram, X, TikTok, Facebook...',
            cat_streaming: 'Streaming',
            cat_streaming_sample: 'YouTube, Netflix, Twitch, Prime...',
            cat_news: 'Notícias',
            cat_news_sample: 'G1, UOL, GE, CNN Brasil...',
            cat_games: 'Jogos',
            cat_games_sample: 'Steam, Roblox, Epic, Discord...',
            status_enabled: 'Ativado',
            status_disabled: 'Desativado',
            custom_title: 'Sereias Personalizadas',
            custom_subtitle: 'Cadastre domínios específicos que desviam sua atenção para silenciá-los durante o foco.',
            custom_count: '{count} Ativos',
            input_placeholder: 'Digite um domínio (ex.: instagram.com, twitch.tv)',
            input_aria: 'Domínio do site personalizado para bloquear',
            btn_add: 'Adicionar Sereia',
            empty_title: 'Nenhuma sereia personalizada cadastrada.',
            empty_subtitle: 'Digite um domínio acima e clique em \'Adicionar Sereia\'.',
            btn_remove_aria: 'Remover domínio {domain} da lista de bloqueio',
            val_empty: 'Digite o endereço de um site para bloquear.',
            val_invalid: 'Endereço de domínio inválido.',
            val_spaces: 'O endereço não pode ter espaços em branco.',
            val_format: 'Formato inválido. Digite um domínio como: youtube.com ou twitter.com',
            val_exists: 'O domínio "{domain}" já está bloqueado na sua lista.',
            alert_add_error_title: 'Atenção ao Bloqueador',
            alert_add_error_msg: 'Não foi possível salvar o site: ',
            alert_toggle_error_title: 'Atenção às Categorias',
            alert_toggle_error_msg: 'Falha ao sincronizar categoria de bloqueio: '
        },
        defaults: {
            task_1: 'Mapear rota de águas profundas',
            task_2: 'Limpar convés de distrações digitais',
            task_3: 'Calibrar sextante de produtividade',
            task_4: 'Navegar por 45 min sem interrupção',
            tpl_german: 'Alemão',
            tpl_german_1: 'Leitura e vocabulário em alemão',
            tpl_german_2: 'Gramática e exercícios práticos',
            tpl_math: 'Matemática',
            tpl_math_1: 'Estudo de teoria e conceitos',
            tpl_math_2: 'Prática e resolução de exercícios'
        }
    },
    en: {
        meta: {
            title_default: 'Nostak - Navigating Deep Focus',
            title_focus: '[{time}] In Open Seas • Nostak',
            title_break: '[{time}] Safe Harbor • Nostak',
            title_paused: '[Paused] Safe Harbor • Nostak',
            title_jornada: 'Nostak - The Navigator\'s Journey',
            title_blocklist: 'Nostak - Blocklist'
        },
        nav: {
            brand_subtitle: 'Navigating Deep Focus',
            journey: 'Journey',
            timer: 'Timer',
            timer_short: 'Timer',
            blocklist: 'Blocklist',
            blocklist_short: 'Block',
            settings: 'Settings',
            settings_aria: 'Open vessel settings',
            website: 'Website',
            website_title: 'Official Website — nostak.app',
            instagram: 'Instagram',
            instagram_title: 'Instagram — @sallesfx'
        },
        settings: {
            dialog_title: 'Vessel Settings',
            close_aria: 'Close settings',
            section_preferences: 'Voyage Preferences',
            sound_title: 'Nautical Bell (Sound Alert)',
            sound_test: 'Test',
            sound_desc: 'Play a gentle chime when focus and break cycles conclude.',
            autobreak_title: 'Automatic Break',
            autobreak_desc: 'Automatically start Safe Harbor timer when focus ends.',
            section_language: 'Language / Idioma',
            language_title: 'Vessel Language',
            language_desc: 'Switch between English and Portuguese in the interface.',
            section_times: 'Default Calibration (Minutes)',
            focus_time: 'Open Sea Focus',
            break_time: 'Port Break',
            section_maintenance: 'Maintenance & Safety',
            unblock_emergency: 'Unblock Network (Emergency)',
            reset_progress: 'Reset Progress',
            btn_close: 'Close',
            btn_save: 'Save Changes',
            feedback_unblocked: 'All sites have been unblocked and network cache restored.',
            feedback_unblock_error: 'Failed to unblock network: ',
            feedback_reset_success: 'Journey progress history has been reset to zero.',
            feedback_reset_error: 'Error resetting progress: ',
            feedback_save_error: 'Error saving settings: ',
            reset_confirm_title: 'Reset Voyage History',
            reset_confirm_msg: 'All accumulated miles, achievements, and completed sessions will be permanently erased.\n\nAre you sure you want to reset your history?',
            reset_confirm_btn: 'Yes, Erase Everything',
            reset_cancel_btn: 'Cancel'
        },
        dialog: {
            confirm_title: 'Confirmation',
            confirm_btn: 'Confirm',
            cancel_btn: 'Cancel',
            alert_title: 'Notice',
            understood_btn: 'Understood'
        },
        timer: {
            status_idle: 'Awaiting',
            status_focus: 'In Open Seas',
            status_break: 'Safe Harbor (Break)',
            status_paused: 'Safe Harbor (Paused)',
            status_completed: 'Voyage Completed',
            status_error: 'Permission Error',
            idle_subtitle: 'Uninterrupted Focus',
            no_task_idle: 'No task attached • Select from Ship\'s Log below',
            no_task_empty: 'No task attached • Add in Ship\'s Log below',
            active_task_prefix: 'Maneuver: ',
            sessions_count: '{done}/{total} sessions',
            btn_customize: 'Customize',
            btn_start: 'Set Sail',
            btn_pause: 'Drop Anchor (Pause)',
            btn_interrupt: 'Interrupt Focus',
            btn_resume: 'Resume Voyage',
            btn_end_break: 'End Break & Focus',
            btn_abort: 'End',
            btn_new_route: 'Prepare New Route',
            navigating_free_focus: 'Sailing in Free Focus',
            paused_title: 'Anchored in Safe Harbor',
            break_title: 'Safe Harbor Break • Sites Unblocked',
            interrupted_title: 'Voyage Interrupted',
            interrupted_desc: 'The sea swayed, but the helm remains in your hands. Readjust the compass and try again.',
            custom_title: 'Calibrate Focus Route',
            custom_close_aria: 'Close calibration dialog',
            custom_focus_label: 'Open Sea Time (Focus)',
            custom_focus_minus_aria: 'Decrease focus time by 5 minutes',
            custom_focus_plus_aria: 'Increase focus time by 5 minutes',
            custom_break_label: 'Rest Harbor (Break)',
            custom_break_minus_aria: 'Decrease break time by 1 minute',
            custom_break_plus_aria: 'Increase break time by 1 minute',
            custom_cancel: 'Cancel',
            custom_submit: 'Set Route',
            minutes_unit: 'min',
            alert_start_error_title: 'Navigator Alert',
            alert_start_error_msg: 'Unable to raise sails and block websites.\n\nDetails: ',
            confirm_interrupt_title: 'Interrupt Voyage',
            confirm_interrupt_msg: 'Do you really want to abandon the open sea route and return to port ahead of time?',
            confirm_interrupt_btn: 'Interrupt Focus',
            confirm_interrupt_cancel: 'Keep Sailing',
            a11y_start: 'Starting voyage in Open Seas. Focus timer active for {mins} minutes.',
            a11y_pause: 'Voyage anchored in Safe Harbor. Blocks temporarily lifted.',
            a11y_resume: 'Resuming voyage in Open Seas. Focus reactivated.',
            a11y_focus_end_break: 'Focus cycle completed. Starting {mins}-minute break in Safe Harbor.',
            a11y_focus_end: 'Focus cycle completed. Vessel docked and sites unblocked.',
            a11y_break_end: 'Break period in Safe Harbor completed. Vessel ready to set sail.',
            a11y_interrupted: 'Voyage interrupted by the navigator.'
        },
        tasks: {
            title: 'Navigator\'s Log',
            subtitle: 'Connect tasks to the timer and track your focus sessions',
            btn_save_template: 'Save Template',
            btn_save_template_title: 'Save current tasks as a new Template',
            btn_new_task: 'New Task',
            templates_label: 'Route Templates (Load Default Tasks):',
            template_name_placeholder: 'Template name (e.g. German, Math, Studies)...',
            template_name_aria: 'Task template name',
            template_cancel: 'Cancel',
            template_save: 'Save Route',
            input_task_placeholder: 'E.g.: Review documentation, draft article, solve exercises...',
            input_task_aria: 'Next task description',
            sessions_aria: 'Number of Pomodoro sessions',
            sessions_title: 'Number of Pomodoro sessions for this task',
            category_aria: 'Task category',
            session_option_1: '1 Session',
            session_option_n: '{count} Sessions',
            category_routine: 'Routine',
            category_urgent: 'Urgent',
            category_focus: 'Focus',
            btn_cancel: 'Cancel',
            btn_add: 'Add Task',
            empty_title: 'Your ship\'s log is empty.',
            empty_subtitle: 'Add your first task above or load a ready-made study route.',
            mark_active_aria: 'Attach task to active timer',
            mark_done_aria: 'Complete task',
            delete_task_aria: 'Delete task',
            delete_template_aria: 'Delete route template',
            alert_add_error_title: 'Log Alert',
            alert_add_error_msg: 'Unable to add task: ',
            alert_template_empty_title: 'Empty Log',
            alert_template_empty_msg: 'Add at least one task before saving a route as a template.',
            confirm_load_template_title: 'Load Task Route',
            confirm_load_template_msg: 'Do you want to load template "{name}"?\nYour current tasks will be replaced by this route\'s tasks.',
            confirm_load_template_btn: 'Load Route',
            confirm_delete_template_title: 'Delete Route Template',
            confirm_delete_template_msg: 'Do you really want to permanently remove template "{name}"?',
            confirm_delete_template_btn: 'Delete Template'
        },
        metrics: {
            title: 'Voyage Status',
            fuel: 'Mental Fuel',
            distance: 'Distance Traveled',
            wind: 'Tailwind',
            wind_calm: 'Calm',
            wind_steady: 'Steady',
            wind_strong: 'Strong',
            fuel_valuetext: '{value}% mental fuel',
            distance_valuetext: '{value} nautical miles traveled',
            region_title: 'Navigation Region',
            satellite_active: 'Active Satellite',
            map_alt: 'Aegean Sea vector nautical chart',
            coordinates: 'COORDINATES: 37°00\'N 25°00\'E',
            cyclades: 'CYCLADES • AEGEAN SEA',
            hours_focus: 'Focus Hours',
            total_miles: 'Total Miles'
        },
        journey: {
            hero_title: 'The Route to Ithaca',
            hero_subtitle: 'Every completed cycle steers distractions away and brings your mind closer to the final destination.',
            current_position: 'CURRENT POSITION',
            map_region_aria: 'Navigation Route Map',
            map_svg_aria: 'Stylized nautical route chart. Current position synced with active sector.',
            marker_you: 'YOU',
            stat_miles: 'NAUTICAL MILES OF FOCUS',
            stat_sirens: 'DISTRACTIONS BLOCKED',
            unit_min: 'min',
            unit_sirens: 'sirens',
            mastery_title: 'Mastery of the Sea',
            badge_level: 'LEVEL {level}',
            card1_title: 'Steel Anchor',
            card1_desc: 'Sustain deep sessions of up to 90 minutes without interrupting the timer.',
            card1_meta: 'Current record: {curr} / 90 min',
            card2_title: 'Silenced Song',
            card2_desc: 'Neutralize 50 distraction attempts by keeping your blocklists active at sea.',
            card2_meta: '{curr} / 50 sirens silenced',
            card3_title: 'Aegean Captain',
            card3_desc: 'Complete 10 full focus voyages without retreating to port.',
            card3_meta: '{curr} / 10 voyages completed',
            next_dest: 'Next Destination',
            horizon_title: 'The Horizon of Mastery',
            horizon_desc: 'Maintain your daily discipline to achieve higher naval ranks and unlock new focus charts.',
            btn_sail_now: 'SET SAIL NOW',
            btn_adjust_blocks: 'ADJUST BLOCKLISTS',
            sector_1: 'Sector 01: Departure Bay',
            sector_2: 'Sector 02: Strait of Discipline',
            sector_3: 'Sector 03: Bronze Waters',
            sector_4: 'Sector 04: Sea of Silence',
            sector_5: 'Sector 05: Archipelago of Mastery'
        },
        blocklist: {
            title: 'Siren Silencer',
            subtitle: 'Block sites and apps that drain your attention. During the voyage, access to these domains will remain locked by the system.',
            cat_social: 'Social Media',
            cat_social_sample: 'Instagram, X, TikTok, Facebook...',
            cat_streaming: 'Streaming',
            cat_streaming_sample: 'YouTube, Netflix, Twitch, Prime...',
            cat_news: 'News',
            cat_news_sample: 'G1, UOL, GE, BBC, CNN...',
            cat_games: 'Games',
            cat_games_sample: 'Steam, Roblox, Epic, Discord...',
            status_enabled: 'Enabled',
            status_disabled: 'Disabled',
            custom_title: 'Custom Sirens',
            custom_subtitle: 'Register specific domains that distract your attention to silence them during focus.',
            custom_count: '{count} Active',
            input_placeholder: 'Enter a domain (e.g.: instagram.com, twitch.tv)',
            input_aria: 'Custom website domain to block',
            btn_add: 'Add Siren',
            empty_title: 'No custom sirens registered.',
            empty_subtitle: 'Enter a domain above and click \'Add Siren\'.',
            btn_remove_aria: 'Remove domain {domain} from blocklist',
            val_empty: 'Enter a website address to block.',
            val_invalid: 'Invalid domain address.',
            val_spaces: 'Address cannot contain whitespace.',
            val_format: 'Invalid format. Enter a domain like: youtube.com or twitter.com',
            val_exists: 'Domain "{domain}" is already blocked in your list.',
            alert_add_error_title: 'Blocker Alert',
            alert_add_error_msg: 'Unable to save website: ',
            alert_toggle_error_title: 'Categories Alert',
            alert_toggle_error_msg: 'Failed to synchronize block category: '
        },
        defaults: {
            task_1: 'Chart a deep-water route',
            task_2: 'Clear the deck of digital distractions',
            task_3: 'Calibrate the productivity sextant',
            task_4: 'Sail for 45 min without interruption',
            tpl_german: 'German',
            tpl_german_1: 'German reading and vocabulary',
            tpl_german_2: 'Grammar and practice exercises',
            tpl_math: 'Math',
            tpl_math_1: 'Theory and concepts study',
            tpl_math_2: 'Practice and problem solving'
        }
    }
};

/**
 * Traduz textos padrão (tarefas/templates de fábrica) para o idioma atual.
 * Textos criados pelo usuário são retornados sem alteração.
 */
export function translateDefault(text) {
    if (typeof text !== 'string') return text;
    const trimmed = text.trim();
    for (const lang of Object.keys(translations)) {
        const dict = translations[lang].defaults || {};
        for (const [key, value] of Object.entries(dict)) {
            if (value === trimmed) {
                return t(`defaults.${key}`);
            }
        }
    }
    return text;
}

/**
 * Detecta o idioma inicial respeitando:
 * 1. Preferência já salva no localStorage ('en' ou 'pt')
 * 2. Idioma do sistema (pt se começar com 'pt', inglês como padrão de preferência)
 */
export function detectInitialLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_LANG_KEY);
        if (saved === 'en' || saved === 'pt') {
            return saved;
        }
    } catch (_) {}

    try {
        const navLang = (typeof navigator !== 'undefined' && ((navigator.languages && navigator.languages[0]) || navigator.language)) || '';
        if (navLang.toLowerCase().startsWith('pt')) {
            return 'pt';
        }
    } catch (_) {}

    // Inglês como padrão de preferência
    return 'en';
}

let currentLanguage = detectInitialLanguage();

export function getLanguage() {
    return currentLanguage;
}

export function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'pt') return;
    currentLanguage = lang;
    try {
        localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (_) {}

    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    }

    applyTranslations();

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nostak:language-changed', {
            detail: { language: lang }
        }));
    }
}

export function toggleLanguage() {
    const next = currentLanguage === 'en' ? 'pt' : 'en';
    setLanguage(next);
    return next;
}

/**
 * Retorna o texto traduzido para a chave informada.
 * Suporta parâmetros no formato {param}.
 */
export function t(key, params = {}) {
    const lang = currentLanguage;
    const parts = key.split('.');
    let cur = translations[lang];

    for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
            cur = cur[part];
        } else {
            // Fallback para inglês se faltar no idioma atual
            cur = null;
            break;
        }
    }

    if (!cur && lang !== 'en') {
        let fallback = translations.en;
        for (const part of parts) {
            if (fallback && typeof fallback === 'object' && part in fallback) {
                fallback = fallback[part];
            } else {
                fallback = null;
                break;
            }
        }
        cur = fallback;
    }

    if (typeof cur !== 'string') {
        return key;
    }

    let result = cur;
    for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
    return result;
}

/**
 * Aplica as traduções recursivamente no DOM procurando atributos data-i18n*.
 */
export function applyTranslations(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // 1. Textos simples (textContent)
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.textContent = translated;
            }
        }
    });

    // 2. HTML seguro (quando há tags internas, ex: <span>)
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.innerHTML = translated;
            }
        }
    });

    // 3. Placeholders
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('placeholder', translated);
            }
        }
    });

    // 4. Titles
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('title', translated);
            }
        }
    });

    // 5. Aria Labels
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.setAttribute('aria-label', translated);
            }
        }
    });

    // Atualiza o documento lang
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLanguage === 'pt' ? 'pt-BR' : 'en';
    }
}
