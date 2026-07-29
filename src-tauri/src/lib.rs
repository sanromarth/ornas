//! ORNAS — Never Lose a Copy.
//!
//! Clipboard productivity workspace built with Tauri v2.
//! This is the library entry point that configures the Tauri application,
//! registers all IPC commands, and wires up the application state.

mod commands;
mod domain;
mod error;
mod infrastructure;
pub mod logging;
mod platform;
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
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
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
            let db = std::sync::Arc::clone(&app_state.db);
            let image_store = std::sync::Arc::clone(&app_state.image_store);
            let platform = std::sync::Arc::clone(&app_state.platform);
            infrastructure::clipboard::monitor::start_clipboard_monitor(
                handle.clone(),
                pipeline,
                db,
                image_store,
                platform,
            );

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

            // Schedule Maintenance & Auto-Backup
            let maintenance_service = std::sync::Arc::clone(&app_state.maintenance_service);
            let backup_manager = std::sync::Arc::clone(&app_state.backup_manager);
            let handle_clone = handle.clone();
            std::thread::Builder::new()
                .name("maintenance".into())
                .spawn(move || {
                    // Wait 5 minutes before first run so we don't slow down startup
                    std::thread::sleep(std::time::Duration::from_secs(300));
                    loop {
                        if let Err(e) = maintenance_service.run_maintenance() {
                            tracing::error!("Maintenance failed: {e}");
                        }

                        if let Err(e) =
                            backup_manager.run_automatic_backup_if_needed(handle_clone.clone())
                        {
                            tracing::error!("Automatic backup failed: {e}");
                        }

                        // Run every 6 hours
                        std::thread::sleep(std::time::Duration::from_secs(6 * 3600));
                    }
                })
                .ok();

            app.manage(app_state);

            tracing::info!("ORNAS initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clipboard::list_clips,
            commands::clipboard::get_filter_counts,
            commands::clipboard::get_clip,
            commands::clipboard::delete_clip,
            commands::clipboard::bulk_delete_clips,
            commands::clipboard::toggle_favorite,
            commands::clipboard::bulk_set_favorite,
            commands::clipboard::toggle_pin,
            commands::clipboard::bulk_set_pinned,
            commands::clipboard::set_clip_language,
            commands::clipboard::restore_files_to_clipboard,
            commands::clipboard::restore_image_to_clipboard,
            commands::clipboard::write_text_to_clipboard,
            commands::system::get_platform_info,
            commands::system::get_diagnostics_info,
            commands::search::search_clips,
            commands::settings::get_settings,
            commands::settings::update_setting,
            commands::backup::validate_backup,
            commands::backup::export_backup,
            commands::backup::import_backup,
            commands::collections::create_collection,
            commands::collections::list_collections,
            commands::collections::update_collection,
            commands::collections::delete_collection,
            commands::collections::assign_clip_to_collection,
            commands::collections::remove_clip_from_collection,
            commands::collections::get_collections_for_clip,
            commands::tags::create_tag,
            commands::tags::list_tags,
            commands::tags::update_tag,
            commands::tags::delete_tag,
            commands::tags::assign_clip_to_tag,
            commands::tags::remove_clip_from_tag,
            commands::tags::get_tags_for_clip,
            commands::vault::setup_vault,
            commands::vault::unlock_vault,
            commands::vault::lock_vault,
            commands::vault::get_vault_status,
            commands::vault::encrypt_clip,
            commands::vault::decrypt_clip,
            commands::vault::get_decrypted_clip,
            commands::diagnostics::run_integrity_check,
            commands::diagnostics::export_diagnostics,
            commands::classification::reanalyze_library,
            #[cfg(debug_assertions)]
            commands::dev::dev_generate_clips,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
