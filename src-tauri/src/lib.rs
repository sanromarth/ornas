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

/// Builds and runs the Tauri application.
///
/// This function is the single entry point called by `main.rs`.
/// It initializes the database, builds the application state,
/// registers all Tauri commands and plugins, and starts the event loop.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
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
        .expect("error while running ORNAS");
}
