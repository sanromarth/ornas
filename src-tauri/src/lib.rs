//! ORNAS — Never Lose a Copy.
//!
//! Clipboard productivity workspace built with Tauri v2.
//! This is the library entry point that configures the Tauri application,
//! registers all IPC commands, and wires up the application state.

mod commands;
mod domain;
mod error;
mod infrastructure;
mod services;
mod state;

use state::AppState;
use tauri::Manager;

/// Builds and runs the Tauri application.
///
/// This function is the single entry point called by `main.rs`.
/// It initializes the database, builds the application state,
/// registers all Tauri commands and plugins, and starts the event loop.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing subscriber for structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("ornas=info")),
        )
        .init();

    tracing::info!("ORNAS starting");

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Initialize application state (DB, repos, services, pipeline)
            let app_state = match AppState::new(handle.clone()) {
                Ok(state) => state,
                Err(e) => {
                    tracing::error!("Failed to initialize application: {e}");
                    return Err(Box::new(e));
                }
            };

            // Start clipboard monitor on background threads
            let pipeline = std::sync::Arc::clone(&app_state.pipeline);
            infrastructure::clipboard::monitor::start_clipboard_monitor(pipeline);

            // Schedule pruning task (10 seconds after startup, then every prune_interval)
            let prune_interval = app_state.config.prune_interval_secs;
            let clip_repo = std::sync::Arc::clone(&app_state.clip_repo);
            let retention_secs = app_state.config.retention_secs();
            std::thread::Builder::new()
                .name("pruner".into())
                .spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(10));
                    loop {
                        match clip_repo.prune_older_than(retention_secs) {
                            Ok(count) if count > 0 => {
                                tracing::info!(count = count, "Pruned old clips");
                            }
                            Ok(_) => {}
                            Err(e) => {
                                tracing::error!("Pruning failed: {e}");
                            }
                        }
                        std::thread::sleep(std::time::Duration::from_secs(prune_interval));
                    }
                })
                .ok();

            app.manage(app_state);

            tracing::info!("ORNAS initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clipboard::list_clips,
            commands::clipboard::get_clip,
            commands::clipboard::delete_clip,
            commands::clipboard::toggle_favorite,
            commands::clipboard::toggle_pin,
            commands::search::search_clips,
            commands::settings::get_settings,
            commands::settings::update_setting,
        ])
        .run(tauri::generate_context!())
        .map_err(|e| {
            tracing::error!("Tauri runtime error: {e}");
            e
        })
        .ok();
}
